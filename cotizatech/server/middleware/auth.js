import jwt from 'jsonwebtoken'
import { db } from '../db/db.js'
import { config } from '../config.js'
import { HttpError } from '../utils/http.js'

const SQL_USUARIO = `
  SELECT u.id, u.email, u.nombre, u.cargo, u.rol, u.empresa_id, u.activo,
         e.nombre AS empresa, e.nit, e.sector, e.direccion, e.ciudad, e.pais, e.telefono
  FROM usuarios u LEFT JOIN empresas e ON e.id = u.empresa_id WHERE u.id = ?`

export const cargarUsuario = (id) => db.prepare(SQL_USUARIO).get(id)

// Lo que el front puede ver del usuario (nunca el hash)
export const usuarioPublico = (u) => ({
  id: u.id, email: u.email, nombre: u.nombre, cargo: u.cargo, rol: u.rol,
  empresa: u.empresa, nit: u.nit, sector: u.sector, direccion: u.direccion, ciudad: u.ciudad, pais: u.pais, telefono: u.telefono,
})

export function emitirSesion(res, usuario) {
  const token = jwt.sign({ sub: usuario.id, rol: usuario.rol }, config.jwtSecret, { expiresIn: `${config.sesionHoras}h` })
  res.cookie(config.cookieName, token, {
    httpOnly: true,                 // JavaScript del navegador no puede leerla (protege de XSS)
    sameSite: 'lax',
    secure: config.prod,            // solo HTTPS en producción
    maxAge: config.sesionHoras * 3600 * 1000,
  })
}

export function autenticar(req, _res, next) {
  const token = req.cookies?.[config.cookieName]
  if (!token) throw new HttpError(401, 'Debes iniciar sesión.')
  let payload
  try { payload = jwt.verify(token, config.jwtSecret) } catch { throw new HttpError(401, 'Tu sesión expiró. Inicia sesión de nuevo.') }
  const u = cargarUsuario(payload.sub)
  if (!u || !u.activo) throw new HttpError(401, 'Debes iniciar sesión.')
  req.user = u
  next()
}

export const requerirRol = (rol) => (req, _res, next) => {
  if (req.user.rol !== rol) throw new HttpError(403, 'No tienes permiso para esta acción.')
  next()
}
