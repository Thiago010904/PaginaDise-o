// Ciclo de vida de la cotización: comprador, asesor, reglas de negocio y vencimientos
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { db, comprador, asesor } from './ayuda.js'

const { marcarVencidas } = await import('../services/vencimientos.js')
const { correo } = await import('../services/CotizacionFacade.js')

test('roles: el comprador no entra al panel del asesor y viceversa', async () => {
  const c = await comprador(), a = await asesor()
  assert.equal((await c.get('/api/asesor/panel')).status, 403)
  assert.equal((await c.get('/api/asesor/solicitudes')).status, 403)
  assert.equal((await a.get('/api/cotizaciones')).status, 403)
})

test('comprador: historial y dashboard coinciden con los datos del Figma (42)', async () => {
  const c = await comprador()
  const l = (await c.get('/api/cotizaciones?por_pagina=7')).body
  assert.equal(l.total, 42)
  assert.equal(l.items.length, 7)
  assert.deepEqual(l.conteos, { Aprobada: 28, Pendiente: 5, Rechazada: 6, Vencida: 3 })
  assert.equal(l.items[0].folio, 'COT-00126')
  assert.equal((await c.get('/api/cotizaciones?estado=Rechazada')).body.total, 6)

  const r = (await c.get('/api/cotizaciones/resumen')).body
  assert.equal(r.aprobadas, 28)
  assert.equal(r.pendientes, 5)
  assert.equal(r.recientes.length, 5)
  assert.ok(r.recientes[0].monto_estimado_usd > 0)
})

test('comprador: detalle en USD, y no puede ver cotizaciones ajenas', async () => {
  const c = await comprador()
  const d = (await c.get('/api/cotizaciones/COT-00124')).body   // 1 servidor HPE DL380 = US$ 2.450
  assert.equal(d.estado, 'Rechazada')
  assert.equal(d.lineas[0].precio_unitario_usd, 2450)
  assert.equal(d.totales_usd.base, 2450)
  assert.equal((await c.get('/api/cotizaciones/SOL-1012')).status, 404, 'es de MercadoLibre')
})

test('flujo completo: carrito → solicitud → asesor cotiza → comprador aprueba', async () => {
  const c = await comprador(), a = await asesor()

  // Enviar solicitud: crea COT-00127 y vacía el carrito
  const nueva = await c.post('/api/cotizaciones')
  assert.equal(nueva.status, 201)
  const folio = nueva.body.folio
  assert.equal(folio, 'COT-00127')
  assert.equal((await c.get('/api/carrito')).body.cantidad, 0)
  assert.equal((await c.post('/api/cotizaciones')).status, 400, 'carrito vacío')

  // Comprador la ve "Pendiente" pero todavía no puede decidir
  let d = (await c.get(`/api/cotizaciones/${folio}`)).body
  assert.equal(d.estado, 'Pendiente'); assert.equal(d.puede_decidir, false)
  assert.equal((await c.post(`/api/cotizaciones/${folio}/decision`, { decision: 'Aprobada' })).status, 409)

  // Asesor: aparece en la bandeja como "Por Cotizar"
  const bandeja = (await a.get('/api/asesor/solicitudes?estado=Por Cotizar&q=tech solutions')).body
  assert.ok(bandeja.items.some((s) => s.folio === folio))
  const sol = (await a.get(`/api/asesor/solicitudes/${folio}`)).body
  assert.equal(sol.estado, 'Por Cotizar')
  assert.equal(sol.items[0].precio_unitario, 899 * 4000)

  // Guardar borrador → estado Borrador
  const edit = { items: sol.items.map((i) => ({ ...i, descuento_pct: 20 })), notas: 'Nota del asesor', validez_dias: 45 }
  const b = await a.put(`/api/asesor/solicitudes/${folio}`, edit)
  assert.equal(b.body.estado, 'Borrador'); assert.equal(b.body.validez_dias, 45)

  // Enviar con 20% → bloqueado por la regla del 15%
  const malo = await a.post(`/api/asesor/solicitudes/${folio}/enviar`)
  assert.equal(malo.status, 422)
  assert.match(malo.body.error, /15%/)
  assert.equal((await a.get(`/api/asesor/solicitudes/${folio}`)).body.estado, 'Borrador', 'no cambió de estado')

  // Corregir y enviar (guardando y enviando en una sola llamada, como hace el editor)
  const ok = await a.post(`/api/asesor/solicitudes/${folio}/enviar`, { ...edit, items: edit.items.map((i) => ({ ...i, descuento_pct: 10 })) })
  assert.equal(ok.status, 200); assert.equal(ok.body.estado, 'Enviada')
  const bruto = sol.items.reduce((a, i) => a + i.cantidad * i.precio_unitario, 0)
  assert.ok(Math.abs(ok.body.totales.total - bruto * 0.9 * 1.19) <= 1)   // 10% de descuento + 19% de IVA

  // Al enviarla se "mandó" el correo simulado al cliente (Observer)
  assert.ok(correo.enviados.some((m) => m.folio === folio && m.para === 'alejandro.torres@empresa.com'))

  // Ahora el comprador sí decide; una segunda vez ya no
  d = (await c.get(`/api/cotizaciones/${folio}`)).body
  assert.equal(d.puede_decidir, true)
  assert.equal((await c.post(`/api/cotizaciones/${folio}/decision`, { decision: 'Aprobada' })).status, 200)
  assert.equal((await c.post(`/api/cotizaciones/${folio}/decision`, { decision: 'Rechazada' })).status, 409)

  // Cerrada: el asesor ya no puede editarla
  assert.equal((await a.put(`/api/asesor/solicitudes/${folio}`, edit)).status, 409)
  assert.equal((await a.post(`/api/asesor/solicitudes/${folio}/rechazar`)).status, 409)

  // Quedó el historial de estados con el usuario que hizo cada cambio (Observer)
  const h = db.prepare('SELECT estado_nuevo, usuario_id FROM cotizacion_historial h JOIN cotizaciones c ON c.id=h.cotizacion_id WHERE c.folio=? ORDER BY h.id').all(folio)
  assert.deepEqual(h.map((x) => x.estado_nuevo), ['Por Cotizar', 'Borrador', 'Enviada', 'Aprobada'])
  assert.ok(h.every((x) => x.usuario_id), 'cada cambio guarda quién lo hizo')
})

test('comprador no puede decidir cotizaciones de otro, ni con decisión inválida', async () => {
  const c = await comprador()
  assert.equal((await c.post('/api/cotizaciones/SOL-1009/decision', { decision: 'Aprobada' })).status, 404)   // Enviada, de Nubank
  assert.equal((await c.post('/api/cotizaciones/COT-00125/decision', { decision: 'Pendiente' })).status, 400)
})

test('asesor: validaciones del editor', async () => {
  const a = await asesor()
  const item = { nombre: 'X', cantidad: 1, precio_unitario: 1000, descuento_pct: 0 }
  assert.equal((await a.put('/api/asesor/solicitudes/SOL-1011', { items: [], notas: '', validez_dias: 30 })).status, 400)
  assert.equal((await a.put('/api/asesor/solicitudes/SOL-1011', { items: [{ ...item, cantidad: 0 }], notas: '', validez_dias: 30 })).status, 400)
  assert.equal((await a.put('/api/asesor/solicitudes/SOL-1011', { items: [{ ...item, descuento_pct: 150 }], notas: '', validez_dias: 30 })).status, 400)
  assert.equal((await a.put('/api/asesor/solicitudes/NO-EXISTE', { items: [item], notas: '', validez_dias: 30 })).status, 404)
  assert.equal((await a.post('/api/asesor/solicitudes/SOL-1011/enviar', { items: [{ ...item, precio_unitario: 0 }], notas: '', validez_dias: 30 })).status, 422)
})

test('asesor: una cotización ya enviada no se edita ni se rechaza (State)', async () => {
  const a = await asesor()
  const item = { nombre: 'X', cantidad: 1, precio_unitario: 1000, descuento_pct: 0 }
  const editar = await a.put('/api/asesor/solicitudes/SOL-1009', { items: [item], notas: '', validez_dias: 30 })
  assert.equal(editar.status, 409)
  assert.match(editar.body.error, /enviada/)
  assert.equal((await a.post('/api/asesor/solicitudes/SOL-1009/rechazar')).status, 409)
  assert.equal((await a.get('/api/asesor/solicitudes/SOL-1009')).body.editable, false)
})

test('asesor: bandeja con filtros y paginación, panel, clientes y reportes', async () => {
  const a = await asesor()
  const todas = (await a.get('/api/asesor/solicitudes?por_pagina=8')).body
  assert.equal(todas.total, db.prepare('SELECT COUNT(*) n FROM cotizaciones').get().n)
  assert.ok(todas.total >= 58)   // 16 de clientes + 42 de Tech Solutions (+ las que crean otros tests)
  assert.equal(todas.items.length, 8)
  assert.ok(todas.items[0].resumen.includes('x '))
  assert.equal((await a.get('/api/asesor/solicitudes?estado=Borrador,Enviada&q=nubank')).body.total, 1)
  assert.equal((await a.get('/api/asesor/solicitudes?q=zzzz')).body.total, 0)

  const p = (await a.get('/api/asesor/panel')).body
  assert.ok(p.pendientes >= 11)   // 9 'Por Cotizar' + 2 'Borrador' del seed
  assert.equal(p.recientes.length, 4)

  const cl = (await a.get('/api/asesor/clientes?q=bancolombia')).body
  assert.equal(cl.items.length, 1); assert.equal(cl.items[0].contacto, 'Juliana Restrepo')

  const r = (await a.get('/api/asesor/reportes')).body
  assert.equal(r.por_estado.length, 6)
  assert.equal(r.top_clientes.length, 5)
  assert.ok(r.kpis.tasa_aprobacion > 0 && r.kpis.tasa_aprobacion <= 100)
})

test('vencimientos: una enviada fuera de vigencia vence y ya no se puede aprobar (RN-03)', async () => {
  const c = await comprador()
  // COT-00125 está "Enviada": la ponemos como enviada hace 60 días con 30 de validez
  db.prepare("UPDATE cotizaciones SET fecha_envio = date('now','-60 days'), validez_dias = 30 WHERE folio = 'COT-00125'").run()
  const r = await c.post('/api/cotizaciones/COT-00125/decision', { decision: 'Aprobada' })
  assert.equal(r.status, 409)
  assert.match(r.body.error, /venció/)
  assert.equal((await c.get('/api/cotizaciones/COT-00125')).body.estado, 'Vencida')
  const h = db.prepare("SELECT estado_anterior, estado_nuevo FROM cotizacion_historial h JOIN cotizaciones c ON c.id=h.cotizacion_id WHERE c.folio='COT-00125' ORDER BY h.id").all()
  assert.deepEqual({ ...h.at(-1) }, { estado_anterior: 'Enviada', estado_nuevo: 'Vencida' })

  // La tarea por lotes hace lo mismo con todas las demás
  db.prepare("UPDATE cotizaciones SET fecha_envio = date('now','-60 days'), validez_dias = 30 WHERE estado = 'Enviada'").run()
  assert.ok(marcarVencidas() > 0)
  assert.equal(db.prepare("SELECT COUNT(*) n FROM cotizaciones WHERE estado='Enviada'").get().n, 0)
})
