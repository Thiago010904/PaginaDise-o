// Prueba unitaria del Patrón Observer: eventos de cambio de estado (sin base de datos ni servidor)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PublicadorEventos, NotificacionCorreoObserver } from '../dominio/eventos/observadores.js'

test('Observer: todos los suscritos reciben el evento y se pueden desuscribir', () => {
  const pub = new PublicadorEventos()
  const recibidos = []
  const espia = { actualizar: (evento, datos) => recibidos.push([evento, datos.folio]) }
  const correo = new NotificacionCorreoObserver({ silencioso: true })
  const quitar = pub.suscribir('x', espia)
  pub.suscribir('x', correo)
  pub.publicar('x', { folio: 'COT-1', nuevo: 'Enviada', cliente: { email: 'a@b.co' } })
  assert.deepEqual(recibidos, [['x', 'COT-1']])
  assert.equal(correo.enviados[0].para, 'a@b.co')
  quitar()
  pub.publicar('x', { folio: 'COT-2', nuevo: 'Borrador' })
  assert.equal(recibidos.length, 1)
  assert.equal(correo.enviados.length, 1, 'Borrador no genera correo')
})
