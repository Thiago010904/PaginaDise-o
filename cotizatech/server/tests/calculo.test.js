// Prueba unitaria del Patrón Strategy: cálculo de descuentos e IVA (sin base de datos ni servidor)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CalculadoraCotizacion, DescuentoPorLineaConTope, SinDescuento, IvaPorcentaje, ExentoDeIva, estrategiaImpuesto } from '../dominio/calculo/estrategias.js'

test('Strategy: descuento con tope del 15% e IVA del 19%', () => {
  const calc = new CalculadoraCotizacion({ descuento: new DescuentoPorLineaConTope(15), impuesto: new IvaPorcentaje(19) })
  const items = [{ cantidad: 2, precio_unitario: 1000, descuento_pct: 10 }, { cantidad: 1, precio_unitario: 500, descuento_pct: 0 }]
  const t = calc.calcular(items)
  assert.equal(t.subtotal, 2500)
  assert.equal(t.descuentos, 200)
  assert.equal(t.base, 2300)
  assert.equal(t.iva, 437)
  assert.equal(t.total, 2737)
  assert.equal(t.num_unidades, 3)
  assert.equal(calc.excedidos([{ descuento_pct: 20, nombre: 'A' }, { descuento_pct: 15, nombre: 'B' }]).length, 1)
})

test('Strategy: se cambian las políticas sin tocar la calculadora', () => {
  const items = [{ cantidad: 1, precio_unitario: 1000, descuento_pct: 10 }]
  const exenta = new CalculadoraCotizacion({ descuento: new SinDescuento(), impuesto: new ExentoDeIva() }).calcular(items)
  assert.equal(exenta.total, 1000)
  assert.ok(estrategiaImpuesto(0) instanceof ExentoDeIva)
  assert.ok(estrategiaImpuesto(19) instanceof IvaPorcentaje)
})
