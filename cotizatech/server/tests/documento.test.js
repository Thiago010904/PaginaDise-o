// Prueba unitaria del Patrón Builder: documento de la cotización (sin base de datos ni servidor)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DocumentoCotizacionBuilder } from '../dominio/documento/DocumentoCotizacionBuilder.js'

test('Builder: arma el documento por partes y exige las obligatorias', () => {
  const doc = new DocumentoCotizacionBuilder()
    .conEncabezado({ folio: 'COT-1', fecha: '2026-11-16', estado: 'Pendiente', puede_decidir: true, validez_dias: 30, vence: '2026-12-16' })
    .conCliente({ solicitante: { nombre: 'Ana' }, empresa: { nombre: 'X SAS', nit: '1' } })
    .conLineas([{ cantidad: 2 }, { cantidad: 3 }])
    .conTotales({ total_con_iva: 10 })
    .conCondiciones('Pago a 30 días')
    .construir()
  assert.equal(doc.num_unidades, 5)
  assert.equal(doc.notas, 'Pago a 30 días')
  assert.throws(() => new DocumentoCotizacionBuilder().conEncabezado({ folio: 'COT-1' }).construir(), /falta: empresa, lineas, totales_usd/)
})
