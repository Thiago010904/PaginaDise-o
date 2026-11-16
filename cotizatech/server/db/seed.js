// npm run db:reset -> BORRA la base y la vuelve a crear con los datos del front
import { rmSync, readFileSync } from 'node:fs'
import { hashPassword } from '../utils/passwords.js'
import { abrirDb, aplicarEsquema, transaccion, DB_PATH, db as compartida } from './db.js'

// db.js abre la base al importarse; en Windows no se puede borrar un archivo abierto
compartida.close()
for (const ext of ['', '-wal', '-shm']) rmSync(DB_PATH + ext, { force: true })
const db = abrirDb()
aplicarEsquema(db)

const seed = JSON.parse(readFileSync(new URL('./seed-data.json', import.meta.url), 'utf8'))
const { config } = seed

const sinPais = (c) => (c || '').replace(/,\s*Colombia$/, '')

transaccion(db, () => {
  // ---- Configuración ----
  const cfg = db.prepare('INSERT INTO configuracion (clave, valor) VALUES (?, ?)')
  for (const [k, v] of Object.entries(config)) cfg.run(k, String(v))

  // ---- Productos ----
  const pInsert = db.prepare(`INSERT INTO productos (id, tipo, subcategoria, marca, nombre, descripcion, precio_usd, unidad, disponibilidad, icono)
    VALUES (@id, @tipo, @subcategoria, @marca, @nombre, @descripcion, @precio_usd, @unidad, @disponibilidad, @icono)`)
  seed.productos.forEach((p) => pInsert.run(p))
  const productoPorId = new Map(seed.productos.map((p) => [p.id, p]))

  // ---- Empresas y usuarios ----
  const eInsert = db.prepare(`INSERT INTO empresas (nombre, nombre_corto, nit, sector, direccion, ciudad, pais, telefono)
    VALUES (?, ?, ?, ?, ?, ?, 'Colombia', ?)`)
  const uInsert = db.prepare(`INSERT INTO usuarios (email, password_hash, nombre, cargo, rol, empresa_id) VALUES (?, ?, ?, ?, ?, ?)`)

  // Usuarios de demo (tomados de AuthContext.jsx)
  const techId = eInsert.run('Tech Solutions S.A.', 'Tech Solutions', '901.234.567-8', 'Tecnología', 'Av. Andrés Bello 1234, Of 501', 'Bogotá', '+57 300 123 4567').lastInsertRowid
  const alejandroId = uInsert.run('alejandro.torres@empresa.com', hashPassword('Cotiza2026'), 'Alejandro Torres', 'Gerente de Compras TI', 'comprador', techId).lastInsertRowid
  const asesorId = uInsert.run('asesor@cotizatech.com', hashPassword('Asesor2026'), 'S. Rodríguez', 'Asesor Senior', 'asesor', null).lastInsertRowid

  // Clientes de las solicitudes: una empresa por NIT + su contacto (sin contraseña = no puede iniciar sesión)
  const empresaPorNit = new Map([['901.234.567-8', techId]])
  const contactoPorEmail = new Map([['alejandro.torres@empresa.com', alejandroId]])
  for (const s of seed.solicitudes) {
    const c = s.cliente
    if (!empresaPorNit.has(c.nit)) {
      empresaPorNit.set(c.nit, eInsert.run(c.nombre, c.corto, c.nit, c.sector, c.direccion, sinPais(c.ciudad), null).lastInsertRowid)
    }
    if (!contactoPorEmail.has(c.email)) {
      contactoPorEmail.set(c.email, uInsert.run(c.email, null, c.contacto, null, 'comprador', empresaPorNit.get(c.nit)).lastInsertRowid)
    }
  }

  // ---- Carrito inicial de Alejandro (igual que el front) ----
  const cart = db.prepare('INSERT INTO carrito_items (usuario_id, producto_id, cantidad) VALUES (?, ?, 1)')
  ;[1, 3, 5].forEach((pid) => cart.run(alejandroId, pid))

  // ---- Cotizaciones ----
  const cInsert = db.prepare(`INSERT INTO cotizaciones
    (folio, empresa_id, solicitante_id, asesor_id, estado, fecha_solicitud, fecha_envio, validez_dias, notas, descuento_adicional, iva_pct, trm)
    VALUES (@folio, @empresa_id, @solicitante_id, @asesor_id, @estado, @fecha, @fecha_envio, @validez, @notas, @descuento_adicional, @iva_pct, @trm)`)
  const iInsert = db.prepare(`INSERT INTO cotizacion_items (cotizacion_id, producto_id, orden, nombre, descripcion, cantidad, precio_unitario, descuento_pct)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
  const envio = (estado, fecha) => (['Por Cotizar', 'Borrador'].includes(estado) ? null : fecha)
  const asesor = (estado) => (estado === 'Por Cotizar' ? null : asesorId)
  const base = { validez: 30, notas: config.notas_default, iva_pct: config.iva_pct, trm: config.trm }

  // (a) Cotizaciones del comprador (COT-xxxxx): precios USD del catálogo -> COP; "Pendiente" = ya enviada al cliente
  for (const c of seed.cotizacionesComprador) {
    const estado = c.estado === 'Pendiente' ? 'Enviada' : c.estado
    const id = cInsert.run({
      ...base, folio: c.folio, empresa_id: techId, solicitante_id: alejandroId, asesor_id: asesor(estado), estado,
      fecha: c.fecha, fecha_envio: envio(estado, c.fecha), descuento_adicional: Math.round(c.descuento * config.trm),
    }).lastInsertRowid
    c.lineas.forEach((l, n) => {
      const p = productoPorId.get(l.id)
      iInsert.run(id, p.id, n, p.nombre, p.descripcion, l.qty, Math.round(p.precio_usd * config.trm), 0)
    })
  }

  // (b) Solicitudes de otros clientes (SOL-xxxx): ya vienen en COP con descuento por línea
  const productoPorNombre = new Map(seed.productos.map((p) => [p.nombre, p.id]))
  for (const s of seed.solicitudes) {
    const id = cInsert.run({
      ...base, folio: s.id, empresa_id: empresaPorNit.get(s.cliente.nit), solicitante_id: contactoPorEmail.get(s.cliente.email),
      asesor_id: asesor(s.estado), estado: s.estado, fecha: s.fecha, fecha_envio: envio(s.estado, s.fecha),
      validez: s.validez, notas: s.notas, descuento_adicional: 0,
    }).lastInsertRowid
    s.items.forEach((i, n) => iInsert.run(id, productoPorNombre.get(i.nombre) ?? null, n, i.nombre, i.desc, i.qty, i.precio, i.descuento))
  }
})

const n = (t) => db.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n
console.log(`Base lista en ${DB_PATH}`)
console.log(`  empresas: ${n('empresas')} | usuarios: ${n('usuarios')} | productos: ${n('productos')} | cotizaciones: ${n('cotizaciones')} | ítems: ${n('cotizacion_items')}`)
db.close()
