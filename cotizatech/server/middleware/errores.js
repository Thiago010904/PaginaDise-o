import { ZodError } from 'zod'
import { HttpError } from '../utils/http.js'

export const noEncontrada = (_req, _res, next) => next(new HttpError(404, 'Ruta no encontrada.'))

// eslint-disable-next-line no-unused-vars
export function manejarErrores(err, _req, res, _next) {
  if (err instanceof ZodError) {
    const campos = Object.fromEntries(err.issues.map((i) => [i.path.join('.') || '_', i.message]))
    return res.status(400).json({ error: err.issues[0]?.message || 'Datos inválidos.', campos })
  }
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, ...(err.detalle && { detalle: err.detalle }) })
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' })
  if (/UNIQUE constraint failed/.test(err.message)) return res.status(409).json({ error: 'Ya existe un registro con esos datos.' })
  if (/constraint failed/.test(err.message) || /por encima del límite/.test(err.message)) return res.status(422).json({ error: err.message })
  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor.' })
}
