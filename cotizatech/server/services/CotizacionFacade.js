// ============================================================
//  Patrón FACADE (GoF, estructural)
//  Punto de entrada único para todo lo que se hace con una cotización.
//  Las rutas solo llaman métodos simples (solicitar, guardar, enviar,
//  decidir...) y esta clase coordina por dentro la base de datos y los
//  otros patrones:
//    - STATE     (dominio/estados)    qué acción permite cada estado
//    - STRATEGY  (dominio/calculo)    cómo se calculan descuentos e IVA
//    - OBSERVER  (dominio/eventos)    quién reacciona a un cambio de estado
//    - BUILDER   (dominio/documento)  cómo se arma el documento para el cliente
// ============================================================
import { z } from 'zod'
import { db as dbCompartida, transaccion } from '../db/db.js'
import { HttpError, cop, usd } from '../utils/http.js'
import { hoy, sumarDias } from '../utils/fechas.js'
import { estadoDe } from '../dominio/estados/EstadoCotizacion.js'
import { CalculadoraCotizacion, DescuentoPorLineaConTope, estrategiaImpuesto } from '../dominio/calculo/estrategias.js'
import { PublicadorEventos, HistorialObserver, NotificacionCorreoObserver, ESTADO_CAMBIADO } from '../dominio/eventos/observadores.js'
import { DocumentoCotizacionBuilder } from '../dominio/documento/DocumentoCotizacionBuilder.js'

// ---------- Validación de lo que envía el editor del asesor ----------
const itemSchema = z.object({
  producto_id: z.number().int().positive().nullish(),
  nombre: z.string().trim().min(1, 'Cada ítem necesita un nombre.').max(200),
  descripcion: z.string().trim().max(1000).nullish(),
  cantidad: z.number().int('La cantidad debe ser un número entero.').min(1, 'La cantidad debe ser al menos 1.').max(1_000_000),
  precio_unitario: z.number().int('El precio debe ser en pesos enteros.').min(0).max(1e12),
  descuento_pct: z.number().min(0).max(100).default(0),
})
export const edicionSchema = z.object({
  items: z.array(itemSchema).min(1, 'Agrega al menos un ítem a la cotización.').max(200),
  notas: z.string().max(4000).default(''),
  validez_dias: z.number().int().min(1).max(365),
})

export class CotizacionFacade {
  constructor({ db, publicador }) {
    this.db = db
    this.publicador = publicador
    this.ultimaRevisionVencimientos = 0
  }

  // ===================== Comprador =====================

  // Crea la solicitud con lo que haya en el carrito y lo vacía. Devuelve el folio.
  solicitarDesdeCarrito(user) {
    return transaccion(this.db, () => {
      const items = this.db.prepare(`
        SELECT p.id, p.nombre, p.descripcion, p.precio_usd, ci.cantidad
        FROM carrito_items ci JOIN productos p ON p.id = ci.producto_id
        WHERE ci.usuario_id = ? AND p.activo = 1 ORDER BY ci.rowid`).all(user.id)
      if (!items.length) throw new HttpError(400, 'Tu cotización está vacía. Agrega productos desde el catálogo.')

      const cfg = this.configuracion()
      const folio = this.#siguienteFolio()
      const { lastInsertRowid: id } = this.db.prepare(`
        INSERT INTO cotizaciones (folio, empresa_id, solicitante_id, estado, fecha_solicitud, validez_dias, notas, iva_pct, trm)
        VALUES (?, ?, ?, 'Por Cotizar', ?, 30, ?, ?, ?)`).run(folio, user.empresa_id, user.id, hoy(), cfg.notas_default, cfg.iva_pct, cfg.trm)

      const ins = this.db.prepare(`INSERT INTO cotizacion_items (cotizacion_id, producto_id, orden, nombre, descripcion, cantidad, precio_unitario, descuento_pct)
                                   VALUES (?, ?, ?, ?, ?, ?, ?, 0)`)
      items.forEach((p, n) => ins.run(id, p.id, n, p.nombre, p.descripcion, p.cantidad, Math.round(p.precio_usd * cfg.trm)))
      this.db.prepare('DELETE FROM carrito_items WHERE usuario_id = ?').run(user.id)
      this.#publicarCambio({ id: Number(id), folio }, null, 'Por Cotizar', user.id, { email: user.email })
      return folio
    })
  }

  // Documento formal para el comprador (valores en USD), armado con el BUILDER
  obtenerParaComprador(folio, user) {
    const { c, items } = this.#cargar(folio, { solicitanteId: user.id })
    const estado = estadoDe(c.estado)
    const t = this.#calculadora(c).calcular(items, c.descuento_adicional)
    return new DocumentoCotizacionBuilder()
      .conEncabezado({ folio: c.folio, fecha: c.fecha_solicitud, estado: estado.vistaComprador, puede_decidir: estado.puedeDecidir, validez_dias: c.validez_dias, vence: this.#vence(c) })
      .conCliente({ solicitante: { nombre: c.contacto, email: c.contacto_email }, empresa: { nombre: c.empresa_nombre, nit: c.nit } })
      .conLineas(t.lineas.map((l) => ({
        id: l.id, producto_id: l.producto_id, icono: l.icono, nombre: l.nombre, descripcion: l.descripcion, cantidad: l.cantidad,
        precio_unitario_usd: usd(l.precio_unitario, c.trm), descuento_pct: l.descuento_pct, subtotal_usd: usd(l.subtotal, c.trm),
      })))
      .conTotales({ subtotal: usd(t.subtotal, c.trm), descuentos: usd(t.descuentos, c.trm), base: usd(t.base, c.trm), iva: usd(t.iva, c.trm), total_con_iva: usd(t.total, c.trm) })
      .conCondiciones(c.notas)
      .construir()
  }

  // El comprador aprueba o rechaza (solo si el estado lo permite)
  decidir(folio, comprador, decision) {
    // Primero se aplica el vencimiento (RN-03) fuera de la transacción de la decisión:
    // si la decisión falla con 409, el paso a "Vencida" no debe deshacerse
    this.#cargar(folio, { solicitanteId: comprador.id })
    transaccion(this.db, () => {
      const { c } = this.#cargar(folio, { solicitanteId: comprador.id })
      const nuevo = estadoDe(c.estado).decidir(decision)
      this.#cambiarEstado(c, nuevo, comprador.id)
    })
    return estadoDe(decision).vistaComprador
  }

  // ===================== Asesor =====================

  obtenerParaAsesor(folio) {
    const { c, items } = this.#cargar(folio)
    const estado = estadoDe(c.estado)
    const calc = this.#calculadora(c)
    const t = calc.calcular(items, c.descuento_adicional)
    return {
      folio: c.folio, estado: c.estado, fecha: c.fecha_solicitud, fecha_envio: c.fecha_envio, validez_dias: c.validez_dias, vence: this.#vence(c),
      notas: c.notas, editable: estado.editable, limite_descuento: calc.descuento.topePct, iva_pct: c.iva_pct, trm: c.trm,
      cliente: { empresa_id: c.empresa_id, nombre: c.empresa_nombre, corto: c.nombre_corto, nit: c.nit, contacto: c.contacto, email: c.contacto_email, direccion: c.direccion, ciudad: c.ciudad, sector: c.sector },
      items: t.lineas.map((l) => ({
        id: l.id, producto_id: l.producto_id, nombre: l.nombre, descripcion: l.descripcion, cantidad: l.cantidad,
        precio_unitario: l.precio_unitario, descuento_pct: l.descuento_pct, subtotal: cop(l.subtotal),
      })),
      totales: { subtotal: cop(t.subtotal), descuentos: cop(t.descuentos), base: cop(t.base), iva: cop(t.iva), total: cop(t.total) },
    }
  }

  // Guardar sin enviar: "Por Cotizar" pasa a "Borrador"
  guardarBorrador(folio, datos, asesorId) {
    transaccion(this.db, () => {
      const { c } = this.#cargar(folio)
      const nuevo = estadoDe(c.estado).guardar()
      this.#reemplazarContenido(c, datos, asesorId)
      this.#cambiarEstado(c, nuevo, asesorId)
    })
  }

  // Enviar al cliente (opcionalmente guardando antes los cambios del editor)
  enviar(folio, datos, asesorId) {
    transaccion(this.db, () => {
      const { c } = this.#cargar(folio)
      const nuevo = estadoDe(c.estado).enviar()
      if (datos) this.#reemplazarContenido(c, datos, asesorId)

      const items = this.#items(c.id)
      const calc = this.#calculadora(c)
      const excedidos = calc.excedidos(items)
      if (excedidos.length) throw new HttpError(422, `Hay descuentos por encima del ${calc.descuento.topePct}% permitido.`, excedidos.map((i) => i.nombre))
      if (items.some((i) => !i.cantidad || !i.precio_unitario)) throw new HttpError(422, 'Todos los ítems deben tener cantidad y precio.')

      this.db.prepare('UPDATE cotizaciones SET fecha_envio = ?, asesor_id = ? WHERE id = ?').run(hoy(), asesorId, c.id)
      this.#cambiarEstado(c, nuevo, asesorId)
    })
  }

  rechazar(folio, asesorId) {
    transaccion(this.db, () => {
      const { c } = this.#cargar(folio)
      const nuevo = estadoDe(c.estado).rechazarPorAsesor()
      this.db.prepare('UPDATE cotizaciones SET asesor_id = ? WHERE id = ?').run(asesorId, c.id)
      this.#cambiarEstado(c, nuevo, asesorId)
    })
  }

  // ===================== Vencimientos (RN-03) =====================

  // Marca "Vencida" toda cotización enviada cuya validez ya pasó. Devuelve cuántas cambió.
  vencerExpiradas() {
    const expiradas = this.db.prepare(`
      SELECT c.id, c.folio, c.estado, u.email FROM cotizaciones c JOIN usuarios u ON u.id = c.solicitante_id
      WHERE c.estado = 'Enviada' AND c.fecha_envio IS NOT NULL AND date(c.fecha_envio, '+' || c.validez_dias || ' days') < ?`).all(hoy())
    transaccion(this.db, () => expiradas.forEach((c) => this.#cambiarEstado({ ...c, contacto_email: c.email }, 'Vencida', null)))
    this.ultimaRevisionVencimientos = Date.now()
    return expiradas.length
  }

  // Para los listados: revisa vencimientos como máximo una vez por minuto
  vencerExpiradasSiCorresponde() {
    if (Date.now() - this.ultimaRevisionVencimientos > 60_000) this.vencerExpiradas()
  }

  // ===================== Apoyo =====================

  configuracion() {
    const c = Object.fromEntries(this.db.prepare('SELECT clave, valor FROM configuracion').all().map((r) => [r.clave, r.valor]))
    return { trm: Number(c.trm), iva_pct: Number(c.iva_pct), limite_descuento: Number(c.limite_descuento_pct), notas_default: c.notas_default }
  }

  // STRATEGY: elige las políticas de cálculo según la configuración y la cotización
  #calculadora(c) {
    return new CalculadoraCotizacion({
      descuento: new DescuentoPorLineaConTope(this.configuracion().limite_descuento),
      impuesto: estrategiaImpuesto(c.iva_pct),
    })
  }

  #cargar(folio, { solicitanteId } = {}) {
    const sql = `
      SELECT c.*, e.nombre AS empresa_nombre, e.nombre_corto, e.nit, e.direccion, e.ciudad, e.sector,
             u.nombre AS contacto, u.email AS contacto_email
      FROM cotizaciones c JOIN empresas e ON e.id = c.empresa_id JOIN usuarios u ON u.id = c.solicitante_id
      WHERE c.folio = ? ${solicitanteId ? 'AND c.solicitante_id = ?' : ''}`
    const c = this.db.prepare(sql).get(...(solicitanteId ? [folio, solicitanteId] : [folio]))
    if (!c) throw new HttpError(404, 'No encontramos esa cotización.')

    // RN-03: si ya pasó la validez, vence en este momento (aunque no haya corrido la tarea programada)
    const vence = this.#vence(c)
    if (vence && vence < hoy()) {
      const nuevo = estadoDe(c.estado).vencer()
      if (nuevo) { this.#cambiarEstado(c, nuevo, null); c.estado = nuevo }
    }
    return { c, items: this.#items(c.id) }
  }

  #items(cotizacionId) {
    return this.db.prepare(`SELECT i.*, p.icono FROM cotizacion_items i LEFT JOIN productos p ON p.id = i.producto_id
                            WHERE i.cotizacion_id = ? ORDER BY i.orden, i.id`).all(cotizacionId)
  }

  #reemplazarContenido(c, datos, asesorId) {
    this.db.prepare('DELETE FROM cotizacion_items WHERE cotizacion_id = ?').run(c.id)
    const ins = this.db.prepare(`INSERT INTO cotizacion_items (cotizacion_id, producto_id, orden, nombre, descripcion, cantidad, precio_unitario, descuento_pct)
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    datos.items.forEach((i, n) => ins.run(c.id, i.producto_id ?? null, n, i.nombre, i.descripcion ?? '', i.cantidad, i.precio_unitario, i.descuento_pct))
    this.db.prepare('UPDATE cotizaciones SET notas = ?, validez_dias = ?, asesor_id = ? WHERE id = ?').run(datos.notas, datos.validez_dias, asesorId, c.id)
  }

  // Guarda el nuevo estado y avisa a los observadores (solo si de verdad cambió)
  #cambiarEstado(c, nuevo, usuarioId) {
    if (c.estado === nuevo) return
    this.db.prepare('UPDATE cotizaciones SET estado = ? WHERE id = ?').run(nuevo, c.id)
    this.#publicarCambio(c, c.estado, nuevo, usuarioId, { email: c.contacto_email })
  }

  #publicarCambio(c, anterior, nuevo, usuarioId, cliente) {
    this.publicador.publicar(ESTADO_CAMBIADO, { cotizacionId: c.id, folio: c.folio, anterior, nuevo, usuarioId, cliente })
  }

  #vence(c) { return c.fecha_envio ? sumarDias(c.fecha_envio, c.validez_dias) : null }

  #siguienteFolio() {
    const { m } = this.db.prepare("SELECT MAX(CAST(SUBSTR(folio, 5) AS INTEGER)) AS m FROM cotizaciones WHERE folio LIKE 'COT-%'").get()
    return `COT-${String((m || 0) + 1).padStart(5, '0')}`
  }
}

// ---------- Instancia que usa la API: se conectan los observadores ----------
export const publicador = new PublicadorEventos()
export const correo = new NotificacionCorreoObserver({ silencioso: process.env.NODE_ENV === 'test' })
publicador.suscribir(ESTADO_CAMBIADO, new HistorialObserver(dbCompartida))
publicador.suscribir(ESTADO_CAMBIADO, correo)

export const cotizaciones = new CotizacionFacade({ db: dbCompartida, publicador })
