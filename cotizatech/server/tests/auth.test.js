// Autenticación, sesión, registro, perfil y manejo de errores generales
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cliente, loginComo, comprador, asesor, url } from './ayuda.js'

test('login: correcto, incorrecto, usuario inexistente y contacto sin contraseña', async () => {
  const c = cliente()
  const ok = await c.post('/api/auth/login', { email: ' ALEJANDRO.torres@empresa.com ', password: 'Cotiza2026' })
  assert.equal(ok.status, 200)
  assert.equal(ok.body.user.rol, 'comprador')
  assert.equal(ok.body.user.empresa, 'Tech Solutions S.A.')
  assert.equal(ok.body.user.password_hash, undefined, 'nunca debe salir el hash')

  assert.equal((await cliente().post('/api/auth/login', { email: 'alejandro.torres@empresa.com', password: 'mala' })).status, 401)
  assert.equal((await cliente().post('/api/auth/login', { email: 'nadie@x.com', password: 'Cotiza2026' })).status, 401)
  assert.equal((await cliente().post('/api/auth/login', { email: 'cmendoza@mercadolibre.com.co', password: '' })).status, 401, 'contacto sin acceso')
})

test('sesión: /me exige login, logout la cierra', async () => {
  assert.equal((await cliente().get('/api/auth/me')).status, 401)
  const c = await comprador()
  assert.equal((await c.get('/api/auth/me')).body.user.email, 'alejandro.torres@empresa.com')
  await c.post('/api/auth/logout')
})

test('roles: el asesor no usa el carrito y sin sesión no hay catálogo', async () => {
  const a = await asesor()
  assert.equal((await a.get('/api/carrito')).status, 403)
  assert.equal((await cliente().get('/api/productos')).status, 401)
})

test('registro: valida, crea cuenta, permite login y rechaza duplicados', async () => {
  const datos = { empresa: 'Nueva SAS', nit: '800.111.222-3', sector: 'Salud', direccion: 'Calle 1 #2-3', ciudad: 'Cali', pais: 'Colombia', telefono: '+57 300 000 0000',
    email: 'Nuevo@Correo.com', representante: 'Ana Pérez', cargo: 'Compras', password: 'claveSegura1', terminos: true }
  const c = cliente()
  assert.equal((await c.post('/api/auth/registro', { ...datos, password: 'corta' })).status, 400)
  assert.equal((await c.post('/api/auth/registro', { ...datos, email: 'no-es-correo' })).status, 400)
  assert.equal((await c.post('/api/auth/registro', { ...datos, terminos: false })).status, 400)
  assert.equal((await c.post('/api/auth/registro', datos)).status, 201)
  assert.equal((await c.post('/api/auth/registro', datos)).status, 409)

  const n = await loginComo('nuevo@correo.com', 'claveSegura1')
  assert.equal((await n.get('/api/auth/me')).body.user.empresa, 'Nueva SAS')

  // Perfil
  const p = await n.patch('/api/auth/perfil', { empresa: 'Nueva SAS', nit: '800.111.222-3', nombre: 'Ana P.', cargo: 'Gerente', ciudad: 'Bogotá' })
  assert.equal(p.status, 200); assert.equal(p.body.user.ciudad, 'Bogotá')
  assert.equal((await n.patch('/api/auth/perfil', { empresa: 'X', nit: '901.234.567-8', nombre: 'Ana' })).status, 409, 'NIT de otra empresa')
})

test('errores: JSON inválido y ruta inexistente', async () => {
  const r = await fetch(url('/api/auth/login'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{malo' })
  assert.equal(r.status, 400)
  assert.equal((await cliente().get('/api/nada')).status, 404)
  assert.equal((await fetch(url('/api/health'))).status, 200)
})
