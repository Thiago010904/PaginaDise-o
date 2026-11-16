// Catálogo de productos y carrito del comprador
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { comprador } from './ayuda.js'

test('catálogo: lista, filtra y busca', async () => {
  const c = await comprador()
  assert.equal((await c.get('/api/productos')).body.items.length, 20)
  assert.equal((await c.get('/api/productos?tipo=Software')).body.items.length, 5)
  assert.equal((await c.get('/api/productos?q=thinkpad')).body.items[0].id, 1)
  assert.equal((await c.get('/api/productos/9999')).status, 404)
})

test('carrito: agregar, sumar, restar, quitar y producto inexistente', async () => {
  const c = await comprador()
  assert.equal((await c.get('/api/carrito')).body.cantidad, 3)   // el seed trae 3 productos
  assert.equal((await c.post('/api/carrito', { producto_id: 1 })).body.cantidad, 4)
  assert.equal((await c.patch('/api/carrito/3', { delta: -1 })).body.items.length, 2)
  assert.equal((await c.del('/api/carrito/5')).body.items.length, 1)
  assert.equal((await c.post('/api/carrito', { producto_id: 99 })).status, 404)
  assert.equal((await c.patch('/api/carrito/7', { delta: 1 })).status, 404, 'no está en el carrito')
  assert.equal((await c.patch('/api/carrito/1', { delta: 'x' })).status, 400)
})
