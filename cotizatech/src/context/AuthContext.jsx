import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/auth.js'
import { SESION_EXPIRADA } from '../api/cliente.js'

export const inicio = (u) => (u.rol === 'asesor' ? '/asesor' : '/dashboard')

const AuthContext = createContext(null)

// Sesión del usuario. La sesión vive en una cookie httpOnly que maneja el back;
// al abrir la app se pregunta a /api/auth/me quién está conectado.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [verificando, setVerificando] = useState(true)

  useEffect(() => {
    authApi.sesionActual()
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setVerificando(false))
    const expiro = () => setUser(null)
    window.addEventListener(SESION_EXPIRADA, expiro)
    return () => window.removeEventListener(SESION_EXPIRADA, expiro)
  }, [])

  // Devuelve el usuario o lanza ApiError con el mensaje del back
  const login = async (email, password) => {
    const r = await authApi.login(email, password)
    setUser(r.user)
    return r.user
  }

  const registrar = (datos) => authApi.registrar(datos)

  const actualizarPerfil = async (cambios) => {
    const r = await authApi.actualizarPerfil(cambios)
    setUser(r.user)
    return r.user
  }

  const logout = async () => {
    await authApi.logout().catch(() => {})
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, verificando, login, registrar, actualizarPerfil, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
