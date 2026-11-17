// Formatos de moneda y fecha usados en toda la interfaz

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

// USD con 2 decimales: 1,234.50
export const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// COP sin decimales: $ 1.234.567
export const fmtCOP = (n) => `$ ${Math.round(n || 0).toLocaleString('es-CO')}`

// COP en millones: $12,5M
export const fmtMillones = (n) => `$${((n || 0) / 1e6).toLocaleString('es-CO', { maximumFractionDigits: 1 })}M`

// '2026-01-15' -> '15 Ene, 2026'
export const fmtFecha = (iso) => {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d} ${MESES[Number(m) - 1]}, ${y}`
}

// '2026-01-15' -> '15 Ene 2026'
export const fmtFechaCorta = (iso) => fmtFecha(iso).replace(',', '')

export const SECTORES = ['Tecnología', 'Banca y Finanzas', 'Retail / E-commerce', 'Salud', 'Educación', 'Manufactura', 'Energía', 'Gobierno', 'Logística', 'Otro']

export const ESTADOS_SOLICITUD = ['Por Cotizar', 'Borrador', 'Enviada', 'Aprobada', 'Rechazada', 'Vencida']
