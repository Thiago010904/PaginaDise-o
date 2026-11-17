// ============================================================
//  Patrón STATE (GoF, comportamiento)
//  Cada estado de la cotización decide qué acciones permite y a qué
//  estado pasa. Así las rutas y el servicio no tienen "if" por estado,
//  y agregar un estado nuevo no obliga a tocar las pantallas.
//
//  Por Cotizar ─guardar─▶ Borrador ─enviar─▶ Enviada ─decidir─▶ Aprobada | Rechazada
//       └──────────enviar──────────────────────▲   └─vencer─▶ Vencida
// ============================================================
import { HttpError } from '../../utils/http.js'

export class EstadoCotizacion {
  constructor(nombre) { this.nombre = nombre }

  // Lo que el comprador ve en su historial (Por Cotizar / Borrador / Enviada => "Pendiente")
  get vistaComprador() { return this.nombre }
  get editable() { return false }       // ¿el asesor puede modificar ítems y notas?
  get puedeDecidir() { return false }   // ¿el comprador puede aprobar o rechazar?

  // Cada transición devuelve el NOMBRE del siguiente estado o lanza un 409
  guardar() { throw this.noPermitido(`Esta cotización ya está ${this.nombre.toLowerCase()} y no se puede modificar.`) }
  enviar() { throw this.noPermitido(`Esta cotización ya está ${this.nombre.toLowerCase()} y no se puede enviar de nuevo.`) }
  rechazarPorAsesor() { throw this.noPermitido(`Esta cotización ya está ${this.nombre.toLowerCase()} y no se puede rechazar.`) }
  decidir() { throw this.noPermitido(`Esta cotización ya fue ${this.nombre.toLowerCase()}.`) }
  vencer() { return null }   // null = este estado no vence

  noPermitido(mensaje) { return new HttpError(409, mensaje) }
}

// Estados en los que el asesor todavía trabaja la cotización
class EnPreparacion extends EstadoCotizacion {
  get vistaComprador() { return 'Pendiente' }
  get editable() { return true }
  guardar() { return 'Borrador' }
  enviar() { return 'Enviada' }
  rechazarPorAsesor() { return 'Rechazada' }
  decidir() { throw this.noPermitido('Esta cotización aún no está lista para tu decisión.') }
}

export class PorCotizar extends EnPreparacion { constructor() { super('Por Cotizar') } }
export class Borrador extends EnPreparacion { constructor() { super('Borrador') } }

export class Enviada extends EstadoCotizacion {
  constructor() { super('Enviada') }
  get vistaComprador() { return 'Pendiente' }
  get puedeDecidir() { return true }
  guardar() { throw this.noPermitido('Esta cotización ya fue enviada al cliente y no se puede modificar.') }
  enviar() { throw this.noPermitido('Esta cotización ya fue enviada al cliente.') }
  rechazarPorAsesor() { throw this.noPermitido('El cliente está revisando esta cotización; solo él puede rechazarla.') }
  decidir(decision) { return decision }   // 'Aprobada' | 'Rechazada'
  vencer() { return 'Vencida' }           // RN-03: pasó la validez sin respuesta
}

export class Aprobada extends EstadoCotizacion { constructor() { super('Aprobada') } }
export class Rechazada extends EstadoCotizacion { constructor() { super('Rechazada') } }

export class Vencida extends EstadoCotizacion {
  constructor() { super('Vencida') }
  decidir() { throw this.noPermitido('Esta cotización venció. Crea una nueva solicitud.') }
}

const ESTADOS_POR_NOMBRE = {
  'Por Cotizar': new PorCotizar(), Borrador: new Borrador(), Enviada: new Enviada(),
  Aprobada: new Aprobada(), Rechazada: new Rechazada(), Vencida: new Vencida(),
}

export const ESTADOS = Object.keys(ESTADOS_POR_NOMBRE)

// Convierte el texto guardado en la base en su objeto estado
export function estadoDe(nombre) {
  const estado = ESTADOS_POR_NOMBRE[nombre]
  if (!estado) throw new Error(`Estado de cotización desconocido: ${nombre}`)
  return estado
}
