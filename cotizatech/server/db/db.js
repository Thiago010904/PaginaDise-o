import { DatabaseSync } from 'node:sqlite'   // SQLite integrado en Node (22.13+), sin instalar nada
import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = dirname(fileURLToPath(import.meta.url))
export const DB_PATH = process.env.DB_PATH ? resolve(process.env.DB_PATH) : resolve(aqui, 'cotizatech.db')
export const SCHEMA_PATH = resolve(aqui, 'schema.sql')

// Abre la base (la crea si no existe) con las opciones recomendadas
export function abrirDb(ruta = DB_PATH) {
  mkdirSync(dirname(ruta), { recursive: true })
  const db = new DatabaseSync(ruta)
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;')   // foreign_keys viene apagado por defecto
  return db
}

// Crea tablas, índices, triggers y vistas (es idempotente)
export function aplicarEsquema(db) {
  db.exec(readFileSync(SCHEMA_PATH, 'utf8'))
}

// Ejecuta fn dentro de una transacción (COMMIT si termina bien, ROLLBACK si lanza error)
export function transaccion(db, fn) {
  db.exec('BEGIN')
  try { const r = fn(); db.exec('COMMIT'); return r }
  catch (e) { db.exec('ROLLBACK'); throw e }
}

// Instancia compartida para el back
export const db = abrirDb()
