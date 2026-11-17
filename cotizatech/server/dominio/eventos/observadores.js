// ============================================================
//  Patrón OBSERVER (GoF, comportamiento)
//  Cuando una cotización cambia de estado, el servicio solo "publica"
//  el evento. Los observadores suscritos reaccionan por su cuenta:
//  uno guarda el historial (RF-10) y otro avisa por correo (RU-08).
//  Agregar otra reacción = suscribir otro observador, sin tocar el servicio.
// ============================================================

export const ESTADO_CAMBIADO = 'cotizacion.estadoCambiado'

// Sujeto: mantiene la lista de observadores y les avisa
export class PublicadorEventos {
  #observadores = new Map()

  suscribir(evento, observador) {
    if (!this.#observadores.has(evento)) this.#observadores.set(evento, [])
    this.#observadores.get(evento).push(observador)
    return () => this.desuscribir(evento, observador)
  }

  desuscribir(evento, observador) {
    this.#observadores.set(evento, (this.#observadores.get(evento) || []).filter((o) => o !== observador))
  }

  publicar(evento, datos) {
    for (const o of this.#observadores.get(evento) || []) o.actualizar(evento, datos)
  }
}

// Observador 1: deja rastro de cada cambio de estado en la base (auditoría)
export class HistorialObserver {
  constructor(db) { this.db = db }
  actualizar(_evento, { cotizacionId, anterior, nuevo, usuarioId }) {
    this.db.prepare('INSERT INTO cotizacion_historial (cotizacion_id, estado_anterior, estado_nuevo, usuario_id) VALUES (?, ?, ?, ?)')
      .run(cotizacionId, anterior, nuevo, usuarioId ?? null)
  }
}

// Observador 2: notificación por correo. En el MVP es SIMULADA (fuera de alcance según el E2):
// guarda el mensaje en memoria y lo muestra en consola.
export class NotificacionCorreoObserver {
  constructor({ silencioso = false } = {}) {
    this.silencioso = silencioso
    this.enviados = []
  }

  actualizar(_evento, { folio, nuevo, cliente }) {
    const mensajes = {
      Enviada: `Tu cotización ${folio} está lista para revisión.`,
      Aprobada: `El cliente aprobó la cotización ${folio}.`,
      Rechazada: `La cotización ${folio} fue rechazada.`,
      Vencida: `La cotización ${folio} venció sin respuesta.`,
    }
    if (!mensajes[nuevo]) return
    const correo = { para: nuevo === 'Enviada' || nuevo === 'Vencida' ? cliente?.email : 'asesores@cotizatech.com', asunto: mensajes[nuevo], folio }
    this.enviados.push(correo)
    if (!this.silencioso) console.info(`[correo simulado] para ${correo.para}: ${correo.asunto}`)
  }
}
