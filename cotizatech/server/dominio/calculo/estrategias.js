// ============================================================
//  Patrón STRATEGY (GoF, comportamiento)
//  Las políticas comerciales (descuento e impuesto) son objetos
//  intercambiables. La calculadora no sabe qué regla concreta aplica:
//  si mañana cambia el IVA o la forma de descontar, se cambia la
//  estrategia y no la calculadora ni el editor (RF-06, RF-07, RN-01).
// ============================================================

// ---------- Estrategias de DESCUENTO ----------
// Descuento en % por cada línea, con tope máximo (RN-01: 15% por defecto)
export class DescuentoPorLineaConTope {
  constructor(topePct) { this.topePct = topePct }
  montoLinea(item) { return (item.cantidad * item.precio_unitario * item.descuento_pct) / 100 }
  // Devuelve los ítems que superan el tope (lista vacía = todo válido)
  excedidos(items) { return items.filter((i) => i.descuento_pct > this.topePct) }
}

// Sin descuentos (útil para listas de precio fijas o pruebas)
export class SinDescuento {
  topePct = 0
  montoLinea() { return 0 }
  excedidos(items) { return items.filter((i) => i.descuento_pct > 0) }
}

// ---------- Estrategias de IMPUESTO ----------
export class IvaPorcentaje {
  constructor(pct) { this.pct = pct }
  calcular(base) { return (base * this.pct) / 100 }
}

export class ExentoDeIva {
  pct = 0
  calcular() { return 0 }
}

export const estrategiaImpuesto = (pct) => (pct > 0 ? new IvaPorcentaje(pct) : new ExentoDeIva())

// ---------- Contexto que usa las estrategias ----------
export class CalculadoraCotizacion {
  constructor({ descuento, impuesto }) {
    this.descuento = descuento
    this.impuesto = impuesto
  }

  // items: [{ cantidad, precio_unitario (COP), descuento_pct }]  ·  descuentoAdicional: COP global
  calcular(items, descuentoAdicional = 0) {
    const lineas = items.map((i) => {
      const bruto = i.cantidad * i.precio_unitario
      const descuento = this.descuento.montoLinea(i)
      return { ...i, bruto, descuento, subtotal: bruto - descuento }
    })
    const subtotal = lineas.reduce((a, l) => a + l.bruto, 0)
    const descuentosLineas = lineas.reduce((a, l) => a + l.descuento, 0)
    const base = subtotal - descuentosLineas - descuentoAdicional
    const iva = this.impuesto.calcular(base)
    return {
      lineas,
      num_unidades: items.reduce((a, i) => a + i.cantidad, 0),
      subtotal,
      descuentos: descuentosLineas + descuentoAdicional,
      base,
      iva,
      total: base + iva,
    }
  }

  excedidos(items) { return this.descuento.excedidos(items) }
}
