// Uso (una sola vez): node server/db/extraer-datos-front.mjs
// Lee los datos "quemados" del front y los vuelca a seed-data.json
import { readFileSync, writeFileSync } from 'node:fs'
import { productos } from '../../src/data/productos.js'
import { cotizacionesIniciales } from '../../src/data/cotizaciones.js'
import { solicitudesIniciales, TRM, IVA, LIMITE_DESCUENTO, NOTAS_DEFAULT } from '../../src/data/solicitudes.js'

// El icono es un componente de React; lo guardamos solo por su nombre
const iconos = {}
for (const m of readFileSync(new URL('../../src/data/productos.js', import.meta.url), 'utf8')
  .matchAll(/id:\s*(\d+),.*?icon:\s*(\w+)/g)) iconos[m[1]] = m[2]

const out = {
  config: { trm: TRM, iva_pct: IVA * 100, limite_descuento_pct: LIMITE_DESCUENTO, notas_default: NOTAS_DEFAULT },
  productos: productos.map((p) => ({
    id: p.id, tipo: p.tab, subcategoria: p.sub, marca: p.marca, nombre: p.nombre, descripcion: p.desc,
    precio_usd: p.precio, unidad: p.unidad ?? null, disponibilidad: p.stock, icono: iconos[p.id] ?? null,
  })),
  cotizacionesComprador: cotizacionesIniciales,   // COT-xxxxx (USD, descuento global absoluto)
  solicitudes: solicitudesIniciales,              // SOL-xxxx (COP, descuento por línea)
}
writeFileSync(new URL('./seed-data.json', import.meta.url), JSON.stringify(out, null, 2))
console.log(`OK: ${out.productos.length} productos, ${out.cotizacionesComprador.length} cotizaciones, ${out.solicitudes.length} solicitudes`)
