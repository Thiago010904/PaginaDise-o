import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/db.js'
import { paginar } from '../utils/http.js'
import { autenticar, requerirRol } from '../middleware/auth.js'
import { cotizaciones } from '../services/CotizacionFacade.js'

// Cotizaciones del COMPRADOR: solo ve las que él mismo solicitó
const router = Router()
router.use(autenticar, requerirRol('comprador'))
// Antes de listar, marca como Vencida lo que ya pasó su validez (RN-03)
router.use((_req, _res, next) => { cotizaciones.vencerExpiradasSiCorresponde(); next() })

// GET /api/cotizaciones?estado=Pendiente&pagina=1&por_pagina=7
router.get('/', (req, res) => {
  const { pagina, por_pagina, offset } = paginar(req.query)
  const estado = req.query.estado ? String(req.query.estado) : null
  const filtro = estado ? 'AND v.estado = ?' : ''
  const args = estado ? [req.user.id, estado] : [req.user.id]

  const items = db.prepare(`
    SELECT v.folio, v.fecha, v.estado, v.puede_decidir, v.num_unidades, v.num_lineas, ROUND(v.base_imponible / c.trm, 2) AS monto_estimado_usd
    FROM v_cotizaciones_comprador v JOIN cotizaciones c ON c.id = v.id
    WHERE v.solicitante_id = ? ${filtro} ORDER BY v.fecha DESC, v.id DESC LIMIT ? OFFSET ?`).all(...args, por_pagina, offset)
    .map((r) => ({ ...r, puede_decidir: Boolean(r.puede_decidir) }))
  const total = db.prepare(`SELECT COUNT(*) AS n FROM v_cotizaciones_comprador v WHERE v.solicitante_id = ? ${filtro}`).get(...args).n
  const conteos = Object.fromEntries(db.prepare('SELECT estado, COUNT(*) AS n FROM v_cotizaciones_comprador WHERE solicitante_id = ? GROUP BY estado').all(req.user.id).map((r) => [r.estado, r.n]))
  res.json({ items, total, pagina, por_pagina, conteos })
})

// GET /api/cotizaciones/resumen  -> KPIs y actividad del dashboard
router.get('/resumen', (req, res) => {
  const filas = db.prepare(`
    SELECT v.estado, COUNT(*) AS n, SUM(v.base_imponible / c.trm) AS usd
    FROM v_cotizaciones_comprador v JOIN cotizaciones c ON c.id = v.id WHERE v.solicitante_id = ? GROUP BY v.estado`).all(req.user.id)
  const conteos = Object.fromEntries(filas.map((r) => [r.estado, r.n]))
  const total = filas.reduce((a, r) => a + r.n, 0)
  const aprobadas = conteos.Aprobada || 0
  const recientes = db.prepare(`
    SELECT v.folio, v.fecha, v.estado, ROUND(v.base_imponible / c.trm, 2) AS monto_estimado_usd
    FROM v_cotizaciones_comprador v JOIN cotizaciones c ON c.id = v.id WHERE v.solicitante_id = ? ORDER BY v.fecha DESC, v.id DESC LIMIT 5`).all(req.user.id)
  res.json({
    total, conteos,
    activas: (conteos.Pendiente || 0) + aprobadas,
    aprobadas, pct_aprobadas: Math.round((aprobadas / Math.max(1, total)) * 100),
    pendientes: conteos.Pendiente || 0,
    monto_aprobado_usd: Math.round((filas.find((r) => r.estado === 'Aprobada')?.usd || 0) * 100) / 100,
    recientes,
  })
})

// POST /api/cotizaciones  -> crea la solicitud con lo que haya en el carrito
router.post('/', (req, res) => {
  res.status(201).json({ folio: cotizaciones.solicitarDesdeCarrito(req.user) })
})

router.get('/:folio', (req, res) => {
  res.json(cotizaciones.obtenerParaComprador(req.params.folio, req.user))
})

// POST /api/cotizaciones/:folio/decision  { decision: 'Aprobada' | 'Rechazada' }
router.post('/:folio/decision', (req, res) => {
  const { decision } = z.object({ decision: z.enum(['Aprobada', 'Rechazada'], 'La decisión debe ser Aprobada o Rechazada.') }).parse(req.body)
  res.json({ folio: req.params.folio, estado: cotizaciones.decidir(req.params.folio, req.user, decision) })
})

export default router
