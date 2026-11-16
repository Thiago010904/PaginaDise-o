import { Router } from 'express'
import { db } from '../db/db.js'
import { HttpError } from '../utils/http.js'
import { autenticar } from '../middleware/auth.js'

const router = Router()
router.use(autenticar)

const COLS = 'id, tipo, subcategoria, marca, nombre, descripcion, precio_usd, unidad, disponibilidad, icono'

// GET /api/productos?tipo=Hardware&sub=Computadoras&q=lenovo
router.get('/', (req, res) => {
  const { tipo, sub, q } = req.query
  const w = ['activo = 1'], p = []
  if (tipo) { w.push('tipo = ?'); p.push(String(tipo)) }
  if (sub) { w.push('subcategoria = ?'); p.push(String(sub)) }
  if (q) { w.push('(nombre LIKE ? OR marca LIKE ? OR descripcion LIKE ?)'); p.push(...Array(3).fill(`%${String(q).trim()}%`)) }
  res.json({ items: db.prepare(`SELECT ${COLS} FROM productos WHERE ${w.join(' AND ')} ORDER BY id`).all(...p) })
})

router.get('/:id', (req, res) => {
  const p = db.prepare(`SELECT ${COLS} FROM productos WHERE id = ? AND activo = 1`).get(Number(req.params.id))
  if (!p) throw new HttpError(404, 'Producto no encontrado.')
  res.json(p)
})

export default router
