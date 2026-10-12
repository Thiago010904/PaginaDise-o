import { createContext, useContext, useState } from 'react'

// Usuarios quemados (solo viven en memoria: al recargar la página se reinician)
const USUARIOS_INICIALES = [
  { email: 'alejandro.torres@empresa.com', password: 'Cotiza2026', nombre: 'Alejandro Torres', cargo: 'Gerente de Compras TI', rol: 'comprador' },
  { email: 'admin@empresa.com', password: 'Admin123', nombre: 'Admin Demo', cargo: 'Administrador de Cotizaciones', rol: 'admin' },
]

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuarios, setUsuarios] = useState(USUARIOS_INICIALES)
  const [user, setUser] = useState(null)

  const login = (email, password) => {
    const u = usuarios.find((x) => x.email === email.trim().toLowerCase() && x.password === password)
    if (!u) return false
    setUser(u)
    return true
  }

  const loginSSO = () => setUser(usuarios[0])

  const registrar = ({ empresa, nit, email, password }) => {
    const correo = email.trim().toLowerCase()
    if (usuarios.some((u) => u.email === correo)) {
      return { ok: false, error: 'Ya existe una cuenta con ese correo.' }
    }
    setUsuarios([...usuarios, { email: correo, password, nombre: empresa.trim(), cargo: `Empresa · NIT ${nit.trim()}`, rol: 'comprador' }])
    return { ok: true }
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, login, loginSSO, registrar, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)