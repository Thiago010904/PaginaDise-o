import { Router } from 'express'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import { db, transaccion } from '../db/db.js'
import { config } from '../config.js'
import { HttpError } from '../utils/http.js'
import { hashPassword, verificarPassword } from '../utils/passwords.js'
import { autenticar, requerirRol, emitirSesion, cargarUsuario, usuarioPublico } from '../middleware/auth.js'

const router = Router()
const txt = (max = 200) => z.string().trim().min(1, 'Completa todos los campos.').max(max)
const email = z.string().trim().toLowerCase().regex(/^\S+@\S+\.\S+$/, 'Ingresa un correo electrónico válido.').max(200)

// Máx. 10 intentos de login por IP cada 15 min (se desactiva en tests)
const limitarLogin = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10, skip: () => process.env.NODE_ENV === 'test',
  message: { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' },
})

router.post('/login', limitarLogin, (req, res) => {
  const { email: correo, password } = z.object({ email: z.string().trim().toLowerCase(), password: z.string().max(128) }).parse(req.body)
  const u = db.prepare('SELECT id, password_hash, activo FROM usuarios WHERE email = ?').get(correo)
  const ok = verificarPassword(password, u?.password_hash)
  if (!u || !ok || !u.activo) throw new HttpError(401, 'Correo o contraseña incorrectos.')
  const usuario = cargarUsuario(u.id)
  emitirSesion(res, usuario)
  res.json({ user: usuarioPublico(usuario) })
})

const registroSchema = z.object({
  empresa: txt(), nit: txt(30), sector: txt(60), direccion: txt(), ciudad: txt(80), pais: txt(60), telefono: txt(30),
  email, representante: txt(), cargo: txt(100),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(128),
  terminos: z.literal(true, 'Debes aceptar los Términos de Servicio y la Política de Privacidad.'),
})

router.post('/registro', (req, res) => {
  const d = registroSchema.parse(req.body)
  transaccion(db, () => {
    if (db.prepare('SELECT 1 FROM usuarios WHERE email = ?').get(d.email)) throw new HttpError(409, 'Ya existe una cuenta con ese correo.')
    let emp = db.prepare('SELECT id FROM empresas WHERE nit = ?').get(d.nit)
    if (!emp) {
      emp = { id: db.prepare('INSERT INTO empresas (nombre, nombre_corto, nit, sector, direccion, ciudad, pais, telefono) VALUES (?,?,?,?,?,?,?,?)')
        .run(d.empresa, d.empresa, d.nit, d.sector, d.direccion, d.ciudad, d.pais, d.telefono).lastInsertRowid }
    }
    db.prepare("INSERT INTO usuarios (email, password_hash, nombre, cargo, rol, empresa_id) VALUES (?,?,?,?, 'comprador', ?)")
      .run(d.email, hashPassword(d.password), d.representante, d.cargo, emp.id)
  })
  res.status(201).json({ ok: true, email: d.email })
})

router.post('/logout', (_req, res) => {
  res.clearCookie(config.cookieName)
  res.json({ ok: true })
})

router.get('/me', autenticar, (req, res) => res.json({ user: usuarioPublico(req.user) }))

const perfilSchema = z.object({
  empresa: txt(), nit: txt(30), sector: z.string().trim().max(60).default(''), direccion: z.string().trim().max(200).default(''),
  ciudad: z.string().trim().max(80).default(''), pais: z.string().trim().max(60).default(''), telefono: z.string().trim().max(30).default(''),
  nombre: txt(), cargo: z.string().trim().max(100).default(''),
})

router.patch('/perfil', autenticar, requerirRol('comprador'), (req, res) => {
  const d = perfilSchema.parse(req.body)
  const choque = db.prepare('SELECT id FROM empresas WHERE nit = ? AND id <> ?').get(d.nit, req.user.empresa_id)
  if (choque) throw new HttpError(409, 'Ese NIT ya está registrado por otra empresa.')
  transaccion(db, () => {
    db.prepare('UPDATE empresas SET nombre = ?, nit = ?, sector = ?, direccion = ?, ciudad = ?, pais = ?, telefono = ? WHERE id = ?')
      .run(d.empresa, d.nit, d.sector, d.direccion, d.ciudad, d.pais, d.telefono, req.user.empresa_id)
    db.prepare('UPDATE usuarios SET nombre = ?, cargo = ? WHERE id = ?').run(d.nombre, d.cargo, req.user.id)
  })
  res.json({ user: usuarioPublico(cargarUsuario(req.user.id)) })
})

export default router
