import { cotizaciones } from './CotizacionFacade.js'

// Marca como "Vencida" toda cotización enviada cuya vigencia ya terminó. Devuelve cuántas cambió.
// Pasa por la fachada para que cada cambio quede en el historial y avise por correo (Observer).
export const marcarVencidas = () => cotizaciones.vencerExpiradas()

// Tarea opcional (AUTO_VENCER=true): revisa cada hora aunque nadie abra las pantallas
export function programarVencimientos() {
  const correr = () => { const n = marcarVencidas(); if (n) console.log(`[vencimientos] ${n} cotización(es) marcadas como Vencida`) }
  correr()
  return setInterval(correr, 60 * 60 * 1000).unref()
}
