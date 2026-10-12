import { productos } from './productos.js'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const fmtFecha = (iso) => {
  const [y, m, d] = iso.split('-')
  return `${d} ${MESES[Number(m) - 1]}, ${y}`
}

export const sumarDias = (iso, dias) =>
  new Date(Date.parse(iso) + dias * 86400000).toISOString().slice(0, 10)

// Calcula líneas, subtotal, descuento y total de una cotización
export const calcular = (c) => {
  const lineas = c.lineas.map((l) => ({ ...productos.find((p) => p.id === l.id), qty: l.qty }))
  const subtotal = lineas.reduce((a, l) => a + l.precio * l.qty, 0)
  const items = lineas.reduce((a, l) => a + l.qty, 0)
  return { lineas, subtotal, items, descuento: c.descuento, total: subtotal - c.descuento }
}

// Las 7 cotizaciones del Figma (datos exactos)
const delFigma = [
  { folio: 'COT-00126', fecha: '2026-01-15', estado: 'Aprobada', descuento: 703, lineas: [{ id: 2, qty: 2 }, { id: 1, qty: 5 }, { id: 3, qty: 3 }, { id: 4, qty: 2 }, { id: 5, qty: 2 }] },
  { folio: 'COT-00125', fecha: '2026-01-12', estado: 'Pendiente', descuento: 40, lineas: [{ id: 7, qty: 2 }, { id: 3, qty: 1 }, { id: 4, qty: 1 }] },
  { folio: 'COT-00124', fecha: '2026-01-08', estado: 'Rechazada', descuento: 0, lineas: [{ id: 2, qty: 1 }] },
  { folio: 'COT-00123', fecha: '2026-01-05', estado: 'Aprobada', descuento: 51, lineas: [{ id: 8, qty: 1 }, { id: 10, qty: 2 }, { id: 5, qty: 4 }, { id: 11, qty: 1 }] },
  { folio: 'COT-00122', fecha: '2025-12-28', estado: 'Vencida', descuento: 20, lineas: [{ id: 2, qty: 8 }, { id: 20, qty: 2 }, { id: 19, qty: 2 }, { id: 4, qty: 4 }, { id: 9, qty: 4 }, { id: 7, qty: 2 }] },
  { folio: 'COT-00121', fecha: '2025-12-15', estado: 'Aprobada', descuento: 39, lineas: [{ id: 5, qty: 1 }, { id: 6, qty: 1 }, { id: 8, qty: 1 }] },
  { folio: 'COT-00120', fecha: '2025-12-10', estado: 'Rechazada', descuento: 107, lineas: [{ id: 7, qty: 3 }, { id: 1, qty: 3 }, { id: 4, qty: 2 }, { id: 3, qty: 2 }, { id: 11, qty: 2 }] },
]

// 35 cotizaciones más (generadas siempre igual) para completar las 42 del Figma
let seed = 7
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
const estados = Array(35).fill('Aprobada')
;[0, 1, 2, 3].forEach((i) => (estados[i] = 'Pendiente'))
;[8, 15, 22, 29].forEach((i) => (estados[i] = 'Rechazada'))
;[20, 31].forEach((i) => (estados[i] = 'Vencida'))

const generadas = estados.map((estado, i) => {
  const usados = new Set()
  const lineas = []
  const n = 1 + Math.floor(rnd() * 4)
  while (lineas.length < n) {
    const id = productos[Math.floor(rnd() * productos.length)].id
    if (usados.has(id)) continue
    usados.add(id)
    lineas.push({ id, qty: 1 + Math.floor(rnd() * 4) })
  }
  const subtotal = lineas.reduce((a, l) => a + productos.find((p) => p.id === l.id).precio * l.qty, 0)
  return {
    folio: `COT-${String(119 - i).padStart(5, '0')}`,
    fecha: new Date(Date.UTC(2025, 11, 8) - i * 3 * 86400000).toISOString().slice(0, 10),
    estado,
    lineas,
    descuento: Math.round(subtotal * 0.03 * Math.floor(rnd() * 4)),
  }
})

// Todas las cotizaciones quemadas pertenecen al comprador Alejandro Torres
const COMPRADOR = { email: 'alejandro.torres@empresa.com', solicitante: 'Alejandro Torres' }
export const cotizacionesIniciales = [...delFigma, ...generadas].map((c) => ({ ...c, ...COMPRADOR }))