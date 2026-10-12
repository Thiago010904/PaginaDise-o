import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { productos } from '../data/productos.js'
import { cotizacionesIniciales } from '../data/cotizaciones.js'
import { solicitudesIniciales, itemDesdeProducto, NOTAS_DEFAULT } from '../data/solicitudes.js'

const Ctx = createContext(null)

const hoy = () => {
  const h = new Date()
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`
}

export function CotizacionesProvider({ children }) {
  const [carrito, setCarrito] = useState([{ id: 1, qty: 1 }, { id: 3, qty: 1 }, { id: 5, qty: 1 }])
  const { user } = useAuth()
  const [todas, setCotizaciones] = useState(cotizacionesIniciales)
  const [solicitudes, setSolicitudes] = useState(solicitudesIniciales)
  const esAsesor = user?.rol === 'asesor'
  // El comprador solo ve sus propias cotizaciones
  const cotizaciones = todas.filter((c) => c.email === user?.email)
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

  // Crea una cotización nueva (queda "Pendiente"), la envía a la bandeja del asesor y devuelve su folio
  const enviar = () => {
    if (esAsesor || !carrito.length) return null
    const num = Math.max(...todas.map((c) => parseInt(c.folio.slice(4), 10))) + 1
    const folio = `COT-${String(num).padStart(5, '0')}`
    const fecha = hoy()
    setCotizaciones((c) => [{ folio, fecha, estado: 'Pendiente', lineas: carrito, descuento: 0, email: user.email, solicitante: user.nombre }, ...c])
    const cliente = {
      nombre: user.empresa || user.nombre, corto: user.empresa || user.nombre, nit: user.nit || '—', contacto: user.nombre, email: user.email,
      direccion: user.direccion || '—', ciudad: [user.ciudad, user.pais].filter(Boolean).join(', ') || '—', sector: user.sector || '—',
    }
    const items = lineas.map((l) => itemDesdeProducto(l, l.qty))
    setSolicitudes((s) => [{ id: `SOL-${folio.slice(4)}`, folio, cliente, fecha, estado: 'Por Cotizar', items, validez: 30, notas: NOTAS_DEFAULT }, ...s])
    setCarrito([]); setCartOpen(false)
    setToast('Cotización enviada a los proveedores')
    return folio
  }

  // El comprador aprueba o rechaza sus propias cotizaciones pendientes
  const cambiarEstado = (folio, estado) => {
    if (esAsesor) return
    setCotizaciones((c) => c.map((x) => (x.folio === folio && x.email === user.email ? { ...x, estado } : x)))
    setToast(`Cotización #${folio} ${estado.toLowerCase()}`)
  }

  // El asesor edita, guarda, envía o rechaza solicitudes
  const actualizarSolicitud = (id, cambios, mensaje) => {
    if (!esAsesor) return
    setSolicitudes((s) => s.map((x) => (x.id === id ? { ...x, ...cambios } : x)))
    if (mensaje) setToast(mensaje)
  }

  return (
    <Ctx.Provider value={{ esAsesor, carrito, lineas, count, total, cotizaciones, solicitudes, cartOpen, setCartOpen, busqueda, setBusqueda, toast, avisar: setToast, agregar, cambiarQty, quitar, enviar, cambiarEstado, actualizarSolicitud }}>
      {children}
    </Ctx.Provider>
  )
}

export const useCotizaciones = () => useContext(Ctx)
