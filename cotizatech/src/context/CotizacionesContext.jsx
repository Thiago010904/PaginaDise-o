import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { productos } from '../data/productos.js'
import { cotizacionesIniciales } from '../data/cotizaciones.js'

const Ctx = createContext(null)

export function CotizacionesProvider({ children }) {
  const [carrito, setCarrito] = useState([{ id: 1, qty: 1 }, { id: 3, qty: 1 }, { id: 5, qty: 1 }])
  const { user } = useAuth()
  const [todas, setCotizaciones] = useState(cotizacionesIniciales)
  const esAdmin = user?.rol === 'admin'
  // El admin ve todas; el comprador solo las suyas
  const cotizaciones = esAdmin ? todas : todas.filter((c) => c.email === user?.email)
  const [cartOpen, setCartOpen] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const lineas = carrito.map((l) => ({ ...productos.find((p) => p.id === l.id), qty: l.qty }))
  const count = carrito.reduce((a, l) => a + l.qty, 0)
  const total = lineas.reduce((a, l) => a + l.precio * l.qty, 0)

  const agregar = (p) => {
    setCarrito((c) => c.some((l) => l.id === p.id) ? c.map((l) => (l.id === p.id ? { ...l, qty: l.qty + 1 } : l)) : [...c, { id: p.id, qty: 1 }])
    setToast(`${p.nombre} agregado a la cotización`)
  }
  const cambiarQty = (id, d) => setCarrito((c) => c.map((l) => (l.id === id ? { ...l, qty: l.qty + d } : l)).filter((l) => l.qty > 0))
  const quitar = (id) => setCarrito((c) => c.filter((l) => l.id !== id))

  // Crea una cotización nueva (queda "Pendiente") y devuelve su folio
  const enviar = () => {
    if (esAdmin || !carrito.length) return null
    const num = Math.max(...todas.map((c) => parseInt(c.folio.slice(4), 10))) + 1
    const folio = `COT-${String(num).padStart(5, '0')}`
    const h = new Date()
    const fecha = `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`
    setCotizaciones((c) => [{ folio, fecha, estado: 'Pendiente', lineas: carrito, descuento: 0, email: user.email, solicitante: user.nombre }, ...c])
    setCarrito([]); setCartOpen(false)
    setToast('Cotización enviada a los proveedores')
    return folio
  }

  const cambiarEstado = (folio, estado) => {
    if (!esAdmin) return // solo el admin puede aprobar o rechazar
    setCotizaciones((c) => c.map((x) => (x.folio === folio ? { ...x, estado } : x)))
    setToast(`Cotización #${folio} ${estado.toLowerCase()}`)
  }

  return (
    <Ctx.Provider value={{ esAdmin, carrito, lineas, count, total, cotizaciones, cartOpen, setCartOpen, busqueda, setBusqueda, toast, avisar: setToast, agregar, cambiarQty, quitar, enviar, cambiarEstado }}>
      {children}
    </Ctx.Provider>
  )
}

export const useCotizaciones = () => useContext(Ctx)