import { crearApp } from './app.js'
import { config } from './config.js'

crearApp().listen(config.port, () => {
  console.log(`API de CotizaTech en http://localhost:${config.port}  (${config.prod ? 'producción' : 'desarrollo'})`)
})
