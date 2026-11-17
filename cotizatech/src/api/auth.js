import { api } from './cliente.js'

// Autenticación y perfil (rutas /api/auth)
export const authApi = {
  sesionActual: () => api.get('/auth/me'),
  login: (email, password) => api.post('/auth/login', { email, password }),
  registrar: (datos) => api.post('/auth/registro', datos),
  logout: () => api.post('/auth/logout'),
  actualizarPerfil: (datos) => api.patch('/auth/perfil', datos),
}
