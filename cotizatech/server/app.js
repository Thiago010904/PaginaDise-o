import express from 'express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from './config.js'
import { noEncontrada, manejarErrores } from './middleware/errores.js'
import auth from './routes/auth.js'
import productos from './routes/productos.js'
import carrito from './routes/carrito.js'

export function crearApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],  // el front usa Google Fonts
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
      },
    },
  }))
  app.use(express.json({ limit: '200kb' }))
  app.use(cookieParser())

  app.get('/api/health', (_req, res) => res.json({ ok: true }))
  app.use('/api/auth', auth)
  app.use('/api/productos', productos)
  app.use('/api/carrito', carrito)
  app.use('/api', noEncontrada)

  // En producción el mismo servidor entrega el front compilado (npm run build)
  const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist')
  if (config.prod && existsSync(dist)) {
    app.use(express.static(dist))
    app.get('/{*ruta}', (_req, res) => res.sendFile(resolve(dist, 'index.html')))
  }

  app.use(manejarErrores)
  return app
}
