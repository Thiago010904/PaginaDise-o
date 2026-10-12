import { createContext, useContext, useState } from 'react'

// Usuarios quemados (solo viven en memoria: al recargar la página se reinician)
const USUARIOS_INICIALES = [
  {
    email: 'alejandro.torres@empresa.com', password: 'Cotiza2026', nombre: 'Alejandro Torres', cargo: 'Gerente de Compras TI', rol: 'comprador',
    empresa: 'Tech Solutions S.A.', nit: '901.234.567-8', sector: 'Tecnología', direccion: 'Av. Andrés Bello 1234, Of 501', ciudad: 'Bogotá', pais: 'Colombia', telefono: '+57 300 123 4567',
  },
  { email: 'asesor@cotizatech.com', password: 'Asesor2026', nombre: 'S. Rodríguez', cargo: 'Asesor Senior', rol: 'asesor' },
]

export const inicio = (u) => (u.rol === 'asesor' ? '/asesor' : '/dashboard')

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

  const registrar = (datos) => {
    const correo = datos.email.trim().toLowerCase()
    if (usuarios.some((u) => u.email === correo)) {
      return { ok: false, error: 'Ya existe una cuenta con ese correo.' }
    }
    const { empresa, nit, sector, direccion, ciudad, pais, telefono, cargo, password, representante } = datos
    setUsuarios([...usuarios, { email: correo, password, nombre: representante.trim(), cargo, empresa: empresa.trim(), nit, sector, direccion, ciudad, pais, telefono, rol: 'comprador' }])
    return { ok: true }
  }

  // Actualiza los datos del perfil del usuario en sesión
  const actualizarPerfil = (cambios) => {
    const nuevo = { ...user, ...cambios }
    setUser(nuevo)
    setUsuarios((us) => us.map((u) => (u.email === user.email ? nuevo : u)))
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, login, loginSSO, registrar, actualizarPerfil, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
