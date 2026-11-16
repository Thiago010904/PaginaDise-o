// Fecha de hoy (YYYY-MM-DD) en hora de Colombia, sin importar la zona del servidor
export const hoy = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })

export const sumarDias = (iso, dias) => new Date(Date.parse(iso) + dias * 86400000).toISOString().slice(0, 10)
