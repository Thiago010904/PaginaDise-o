// Prueba unitaria del Patrón State: estados de la cotización (sin base de datos ni servidor)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { estadoDe, ESTADOS } from '../dominio/estados/EstadoCotizacion.js'

test('State: transiciones permitidas', () => {
  assert.deepEqual(ESTADOS, ['Por Cotizar', 'Borrador', 'Enviada', 'Aprobada', 'Rechazada', 'Vencida'])
  assert.equal(estadoDe('Por Cotizar').guardar(), 'Borrador')
  assert.equal(estadoDe('Borrador').enviar(), 'Enviada')
  assert.equal(estadoDe('Borrador').rechazarPorAsesor(), 'Rechazada')
  assert.equal(estadoDe('Enviada').decidir('Aprobada'), 'Aprobada')
  assert.equal(estadoDe('Enviada').vencer(), 'Vencida')
  assert.equal(estadoDe('Borrador').vencer(), null)
})

test('State: transiciones inválidas lanzan 409', () => {
  const casos = [
    () => estadoDe('Borrador').decidir('Aprobada'),   // aprobar un borrador
    () => estadoDe('Enviada').guardar(),              // editar lo que ya vio el cliente
    () => estadoDe('Aprobada').enviar(),
    () => estadoDe('Vencida').decidir('Aprobada'),
    () => estadoDe('Rechazada').rechazarPorAsesor(),
  ]
  for (const caso of casos) assert.throws(caso, (e) => e.status === 409)
  assert.throws(() => estadoDe('Inventado'))
})

test('State: lo que ve el comprador', () => {
  assert.equal(estadoDe('Por Cotizar').vistaComprador, 'Pendiente')
  assert.equal(estadoDe('Enviada').vistaComprador, 'Pendiente')
  assert.equal(estadoDe('Enviada').puedeDecidir, true)
  assert.equal(estadoDe('Borrador').puedeDecidir, false)
  assert.equal(estadoDe('Aprobada').vistaComprador, 'Aprobada')
})
