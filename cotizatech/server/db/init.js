// npm run db:init  -> crea la base vacía (solo estructura)
import { db, aplicarEsquema, DB_PATH } from './db.js'
aplicarEsquema(db)
console.log('Base creada en', DB_PATH)
