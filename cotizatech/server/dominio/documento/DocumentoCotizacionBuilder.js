// ============================================================
//  Patrón BUILDER (GoF, creacional)
//  El documento formal de la cotización (el que ve el cliente y se
//  exporta a PDF, RF-09 / RU-08) se arma por partes: encabezado,
//  cliente, líneas, totales y condiciones. El builder valida que no
//  falte ninguna parte antes de entregar el documento.
// ============================================================

export class DocumentoCotizacionBuilder {
  #doc = {}

  conEncabezado({ folio, fecha, estado, puede_decidir, validez_dias, vence }) {
    Object.assign(this.#doc, { folio, fecha, estado, puede_decidir, validez_dias, vence })
    return this
  }

  conCliente({ solicitante, empresa }) {
    Object.assign(this.#doc, { solicitante, empresa })
    return this
  }

  conLineas(lineas) {
    this.#doc.lineas = lineas
    this.#doc.num_unidades = lineas.reduce((a, l) => a + l.cantidad, 0)
    return this
  }

  conTotales(totales_usd) {
    this.#doc.totales_usd = totales_usd
    return this
  }

  conCondiciones(notas) {
    this.#doc.notas = notas ?? ''
    return this
  }

  construir() {
    const faltan = ['folio', 'empresa', 'lineas', 'totales_usd'].filter((k) => this.#doc[k] === undefined)
    if (faltan.length) throw new Error(`Documento de cotización incompleto, falta: ${faltan.join(', ')}`)
    return { ...this.#doc }
  }
}
