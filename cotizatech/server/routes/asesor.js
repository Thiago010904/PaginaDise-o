import { Router } from 'express'
import { db } from '../db/db.js'
import { paginar, cop } from '../utils/http.js'
import { autenticar, requerirRol } from '../middleware/auth.js'
import { cotizaciones, edicionSchema } from '../services/CotizacionFacade.js'
import { ESTADOS } from '../dominio/estados/EstadoCotizacion.js'

// Panel del ASESOR: ve todas las cotizaciones de todos los clientes
const router = Router()
router.use(autenticar, requerirRol('asesor'))
// Antes de listar, marca como Vencida lo que ya pasó su validez (RN-03)
router.use((_req, _res, next) => { cotizaciones.vencerExpiradasSiCorresponde(); next() })

const BASE = `FROM cotizaciones c JOIN empresas e ON e.id = c.empresa_id JOIN v_cotizacion_totales t ON t.cotizacion_id = c.id`

// Filtro de texto: cliente, NIT, folio o nombre de algún ítem
function filtroTexto(q) {
  if (!q) return { sql: '1 = 1', args: [] }
  const like = `%${String(q).trim()}%`
  return {
    sql: `(e.nombre LIKE ? OR e.nit LIKE ? OR c.folio LIKE ? OR EXISTS (SELECT 1 FROM cotizacion_items i WHERE i.cotizacion_id = c.id AND i.nombre LIKE ?))`,
    args: [like, like, like, like],
  }
}

// GET /api/asesor/solicitudes?estado=Borrador,Enviada&q=bancolombia&pagina=1&por_pagina=8
router.get('/solicitudes', (req, res) => {
  const { pagina, por_pagina, offset } = paginar(req.query)
  const estados = String(req.query.estado || '').split(',').map((s) => s.trim()).filter((s) => ESTADOS.includes(s))
  const txt = filtroTexto(req.query.q)
  const filtroEstado = estados.length ? `AND c.estado IN (${estados.map(() => '?').join(',')})` : ''

  const items = db.prepare(`
    SELECT c.folio, c.estado, c.fecha_solicitud AS fecha, c.fecha_envio, e.nombre AS cliente, e.nit, t.num_lineas, ROUND(t.total) AS total,
      (SELECT group_concat(x.cantidad || 'x ' || x.nombre, ', ') FROM (SELECT cantidad, nombre FROM cotizacion_items WHERE cotizacion_id = c.id ORDER BY orden, id) x) AS resumen
    ${BASE} WHERE ${txt.sql} ${filtroEstado} ORDER BY c.fecha_solicitud DESC, c.id DESC LIMIT ? OFFSET ?`).all(...txt.args, ...estados, por_pagina, offset)
  const total = db.prepare(`SELECT COUNT(*) AS n ${BASE} WHERE ${txt.sql} ${filtroEstado}`).get(...txt.args, ...estados).n
  const conteos = Object.fromEntries(db.prepare(`SELECT c.estado, COUNT(*) AS n ${BASE} WHERE ${txt.sql} GROUP BY c.estado`).all(...txt.args).map((r) => [r.estado, r.n]))
  res.json({ items, total, pagina, por_pagina, conteos })
})

router.get('/solicitudes/:folio', (req, res) => res.json(cotizaciones.obtenerParaAsesor(req.params.folio)))

// Guardar cambios del editor (sin enviar)
router.put('/solicitudes/:folio', (req, res) => {
  cotizaciones.guardarBorrador(req.params.folio, edicionSchema.parse(req.body), req.user.id)
  res.json(cotizaciones.obtenerParaAsesor(req.params.folio))
})

// Enviar al cliente. El cuerpo es opcional: si viene, guarda esos cambios primero.
router.post('/solicitudes/:folio/enviar', (req, res) => {
  const datos = req.body && Object.keys(req.body).length ? edicionSchema.parse(req.body) : null
  cotizaciones.enviar(req.params.folio, datos, req.user.id)
  res.json(cotizaciones.obtenerParaAsesor(req.params.folio))
})

router.post('/solicitudes/:folio/rechazar', (req, res) => {
  cotizaciones.rechazar(req.params.folio, req.user.id)
  res.json(cotizaciones.obtenerParaAsesor(req.params.folio))
})

// GET /api/asesor/panel
router.get('/panel', (_req, res) => {
  const k = db.prepare(`
    SELECT SUM(c.estado IN ('Por Cotizar','Borrador')) AS pendientes, SUM(c.estado = 'Aprobada') AS aprobadas,
           SUM(CASE WHEN c.estado <> 'Rechazada' THEN t.total ELSE 0 END) AS valor, COUNT(DISTINCT c.empresa_id) AS clientes
    ${BASE}`).get()
  const recientes = db.prepare(`
    SELECT c.folio, c.estado, c.fecha_solicitud AS fecha, e.nombre AS cliente, e.nit, ROUND(t.total) AS total,
      (SELECT group_concat(x.cantidad || 'x ' || x.nombre, ', ') FROM (SELECT cantidad, nombre FROM cotizacion_items WHERE cotizacion_id = c.id ORDER BY orden, id) x) AS resumen
    ${BASE} ORDER BY c.fecha_solicitud DESC, c.id DESC LIMIT 4`).all()
  res.json({ pendientes: k.pendientes || 0, aprobadas: k.aprobadas || 0, valor_cotizado: cop(k.valor || 0), clientes_activos: k.clientes, recientes })
})

// GET /api/asesor/clientes?q=
router.get('/clientes', (req, res) => {
  const like = `%${String(req.query.q || '').trim()}%`
  const items = db.prepare(`
    SELECT r.empresa_id, r.nombre, e.nombre_corto AS corto, r.nit, r.sector, r.ciudad, r.solicitudes, r.aprobadas, ROUND(r.valor) AS valor, r.ultima,
      (SELECT u.nombre FROM cotizaciones c JOIN usuarios u ON u.id = c.solicitante_id WHERE c.empresa_id = r.empresa_id ORDER BY c.fecha_solicitud DESC, c.id DESC LIMIT 1) AS contacto,
      (SELECT u.email  FROM cotizaciones c JOIN usuarios u ON u.id = c.solicitante_id WHERE c.empresa_id = r.empresa_id ORDER BY c.fecha_solicitud DESC, c.id DESC LIMIT 1) AS email
    FROM v_clientes_resumen r JOIN empresas e ON e.id = r.empresa_id
    WHERE r.nombre LIKE ? OR r.nit LIKE ? ORDER BY r.valor DESC`).all(like, like)
  res.json({ items, total: items.length })
})

// GET /api/asesor/reportes
router.get('/reportes', (_req, res) => {
  const filas = db.prepare(`SELECT c.estado, COUNT(*) AS n, SUM(t.total) AS valor ${BASE} GROUP BY c.estado`).all()
  const por_estado = ESTADOS.map((estado) => {
    const f = filas.find((x) => x.estado === estado)
    return { estado, n: f?.n || 0, valor: cop(f?.valor || 0) }
  })
  const v = (e) => por_estado.find((x) => x.estado === e)
  const cerradas = v('Aprobada').n + v('Rechazada').n
  const top_clientes = db.prepare(`SELECT empresa_id, nombre, nit, solicitudes, aprobadas, ROUND(valor) AS valor FROM v_clientes_resumen LIMIT 5`).all()
  res.json({
    por_estado,
    kpis: {
      valor_cotizado: por_estado.filter((x) => x.estado !== 'Rechazada').reduce((a, x) => a + x.valor, 0),
      valor_aprobado: v('Aprobada').valor, contratos_ganados: v('Aprobada').n, cerradas,
      tasa_aprobacion: cerradas ? Math.round((v('Aprobada').n / cerradas) * 100) : 0,
      ticket_promedio: v('Aprobada').n ? cop(v('Aprobada').valor / v('Aprobada').n) : 0,
    },
    top_clientes,
  })
})

export default router
