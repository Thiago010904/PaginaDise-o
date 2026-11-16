import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/db.js'
import { HttpError } from '../utils/http.js'
import { autenticar, requerirRol } from '../middleware/auth.js'

const router = Router()
router.use(autenticar, requerirRol('comprador'))

// Devuelve siempre el carrito completo para que el front solo reemplace su estado
function carrito(userId) {
  const items = db.prepare(`
    SELECT p.id AS producto_id, p.tipo, p.marca, p.nombre, p.descripcion, p.precio_usd, p.unidad, p.icono, ci.cantidad
    FROM carrito_items ci JOIN productos p ON p.id = ci.producto_id WHERE ci.usuario_id = ? ORDER BY ci.rowid`).all(userId)
  return {
    items,
    cantidad: items.reduce((a, i) => a + i.cantidad, 0),
    total_usd: Math.round(items.reduce((a, i) => a + i.precio_usd * i.cantidad, 0) * 100) / 100,
  }
}
const productoId = (req) => {
  const id = z.coerce.number().int().positive().parse(req.params.productoId ?? req.body?.producto_id)
  if (!db.prepare('SELECT 1 FROM productos WHERE id = ? AND activo = 1').get(id)) throw new HttpError(404, 'Producto no encontrado.')
  return id
}

router.get('/', (req, res) => res.json(carrito(req.user.id)))

// Agregar 1 unidad (si ya está, suma)
router.post('/', (req, res) => {
  db.prepare(`INSERT INTO carrito_items (usuario_id, producto_id, cantidad) VALUES (?, ?, 1)
              ON CONFLICT (usuario_id, producto_id) DO UPDATE SET cantidad = cantidad + 1`).run(req.user.id, productoId(req))
  res.json(carrito(req.user.id))
})

// Cambiar cantidad en +1 / -1 (si llega a 0 se quita)
router.patch('/:productoId', (req, res) => {
  const { delta } = z.object({ delta: z.number().int().min(-100).max(100) }).parse(req.body)
  const id = productoId(req)
  const fila = db.prepare('SELECT cantidad FROM carrito_items WHERE usuario_id = ? AND producto_id = ?').get(req.user.id, id)
  if (!fila) throw new HttpError(404, 'Ese producto no está en tu cotización.')
  const nueva = fila.cantidad + delta
  if (nueva > 0) db.prepare('UPDATE carrito_items SET cantidad = ? WHERE usuario_id = ? AND producto_id = ?').run(nueva, req.user.id, id)
  else db.prepare('DELETE FROM carrito_items WHERE usuario_id = ? AND producto_id = ?').run(req.user.id, id)   // llegó a 0: se quita
  res.json(carrito(req.user.id))
})

router.delete('/:productoId', (req, res) => {
  db.prepare('DELETE FROM carrito_items WHERE usuario_id = ? AND producto_id = ?').run(req.user.id, productoId(req))
  res.json(carrito(req.user.id))
})

export default router
