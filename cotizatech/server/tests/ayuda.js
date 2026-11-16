// Utilidades compartidas por las pruebas de la API.
// Cada archivo de prueba corre en su propio proceso con una base temporal: no toca tu cotizatech.db
import { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const dir = mkdtempSync(join(tmpdir(), 'cotizatech-'))
process.env.DB_PATH = join(dir, 'test.db')
process.env.NODE_ENV = 'test'
execFileSync('node', ['--no-warnings', 'server/db/seed.js'], { env: process.env, stdio: 'ignore' })

const { crearApp } = await import('../app.js')
export const { db } = await import('../db/db.js')

let server, base
before(() => new Promise((ok) => { server = crearApp().listen(0, () => { base = `http://localhost:${server.address().port}`; ok() }) }))
after(() => { server.close(); db.close(); rmSync(dir, { recursive: true, force: true }) })

export const url = (ruta) => base + ruta

// Cliente HTTP con "cookie jar": cada sesión guarda su cookie
export function cliente() {
  let cookie = ''
  const call = async (metodo, ruta, body) => {
    const r = await fetch(base + ruta, { method: metodo, headers: { 'content-type': 'application/json', ...(cookie && { cookie }) }, body: body ? JSON.stringify(body) : undefined })
    const sc = r.headers.getSetCookie?.()[0]
    if (sc) cookie = sc.split(';')[0]
    return { status: r.status, body: await r.json().catch(() => null) }
  }
  return { get: (r) => call('GET', r), post: (r, b) => call('POST', r, b ?? {}), put: (r, b) => call('PUT', r, b), patch: (r, b) => call('PATCH', r, b), del: (r) => call('DELETE', r) }
}

export const loginComo = async (email, password) => {
  const c = cliente()
  const r = await c.post('/api/auth/login', { email, password })
  assert.equal(r.status, 200, `login ${email}`)
  return c
}
export const comprador = () => loginComo('alejandro.torres@empresa.com', 'Cotiza2026')
export const asesor = () => loginComo('asesor@cotizatech.com', 'Asesor2026')
