import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { carritoApi } from '../api/catalogo.js'
import { cotizacionesApi } from '../api/cotizaciones.js'

const Ctx = createContext(null)
const CARRITO_VACIO = { items: [], cantidad: 0, total_usd: 0 }

// Estado compartido de la interfaz: carrito del comprador (guardado en el back),
// búsqueda del catálogo, panel lateral del carrito y avisos (toast).
export function CotizacionesProvider({ children }) {
  const { user } = useAuth()
  const esAsesor = user?.rol === 'asesor'
  const [carrito, setCarrito] = useState(CARRITO_VACIO)
  const [cartOpen, setCartOpen] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  // Avisos: avisar('Listo') o avisar('Algo falló', 'error')
  const avisar = useCallback((texto, tipo = 'ok') => setToast({ texto, tipo }), [])
  const avisarError = useCallback((e) => setToast({ texto: e.message, tipo: 'error' }), [])

  // El carrito se carga del back cuando entra un comprador
  useEffect(() => {
    if (!user || esAsesor) { setCarrito(CARRITO_VACIO); return }
    carritoApi.obtener().then(setCarrito).catch(avisarError)
  }, [user, esAsesor, avisarError])

  const agregar = async (p) => {
    try {
      setCarrito(await carritoApi.agregar(p.id))
      avisar(`${p.nombre} agregado a la cotización`)
    } catch (e) { avisarError(e) }
  }
  const cambiarQty = async (productoId, delta) => {
    try { setCarrito(await carritoApi.cambiarCantidad(productoId, delta)) } catch (e) { avisarError(e) }
  }
  const quitar = async (productoId) => {
    try { setCarrito(await carritoApi.quitar(productoId)) } catch (e) { avisarError(e) }
  }

  // Envía la solicitud con lo que hay en el carrito y devuelve el folio creado
  const enviar = async () => {
    try {
      const { folio } = await cotizacionesApi.solicitar()
      setCarrito(CARRITO_VACIO)
      setCartOpen(false)
      avisar(`Solicitud ${folio} enviada al asesor`)
      return folio
    } catch (e) {
      avisarError(e)
      return null
    }
  }

  return (
    <Ctx.Provider value={{
      esAsesor, carrito, count: carrito.cantidad, total: carrito.total_usd, lineas: carrito.items,
      cartOpen, setCartOpen, busqueda, setBusqueda, toast, avisar, avisarError,
      agregar, cambiarQty, quitar, enviar,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useCotizaciones = () => useContext(Ctx)
