import { useState } from 'react'
import { useCotizaciones } from '../context/CotizacionesContext.jsx'
import { productos } from '../data/productos.js'
import { fmt } from '../data/cotizaciones.js'
import { ShoppingCart, Plus, PackageSearch } from 'lucide-react'

const tabs = ['Hardware', 'Software', 'Servicios']
const rangos = [
  { label: 'Menor a $100 USD', test: (p) => p < 100 },
  { label: '$100 - $500 USD', test: (p) => p >= 100 && p <= 500 },
  { label: '$500 - $1,500 USD', test: (p) => p > 500 && p <= 1500 },
  { label: 'Mayor a $1,500 USD', test: (p) => p > 1500 },
]
const vacio = { sub: [], precio: [], marca: [] }

export default function Catalogo() {
  const { agregar, busqueda, setBusqueda, count, setCartOpen } = useCotizaciones()
  const [tab, setTab] = useState('Hardware')
  const [filtros, setFiltros] = useState(vacio)

  const delTab = productos.filter((p) => p.tab === tab)
  const subs = [...new Set(delTab.map((p) => p.sub))]
  const marcas = [...new Set(delTab.map((p) => p.marca))]
  const q = busqueda.trim().toLowerCase()
  const visibles = delTab.filter((p) => {
    if (q && !`${p.nombre} ${p.desc} ${p.marca}`.toLowerCase().includes(q)) return false
    if (filtros.sub.length && !filtros.sub.includes(p.sub)) return false
    if (filtros.marca.length && !filtros.marca.includes(p.marca)) return false
    if (filtros.precio.length && !rangos.some((r) => filtros.precio.includes(r.label) && r.test(p.precio))) return false
    return true
  })
  const grupos = [
    { key: 'sub', titulo: 'SUBCATEGORÍAS', ops: subs.map((s) => [s, delTab.filter((p) => p.sub === s).length]) },
    { key: 'precio', titulo: 'RANGO DE PRECIO', ops: rangos.map((r) => [r.label, delTab.filter((p) => r.test(p.precio)).length]) },
    { key: 'marca', titulo: 'MARCA HOMOLOGADA', ops: marcas.map((m) => [m, delTab.filter((p) => p.marca === m).length]) },
  ]
  const toggle = (g, v) => setFiltros((f) => ({ ...f, [g]: f[g].includes(v) ? f[g].filter((x) => x !== v) : [...f[g], v] }))
  const cambiarTab = (t) => { setTab(t); setFiltros(vacio) }
  const limpiar = () => { setFiltros(vacio); setBusqueda('') }

  return (
    <>
      <div className="mt-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-[28px] font-semibold">Catálogo de Productos</h1>
          <p className="mt-1 text-xs text-slate-500">Selecciona hardware, software o servicios homologados para tus proyectos corporativos.</p>
        </div>
        <button onClick={() => setCartOpen(true)} className="flex h-8 items-center gap-2 rounded-lg bg-brand px-4 text-xs font-semibold text-white hover:bg-blue-700">
          <ShoppingCart size={14} /> Cotización ({count} items)
        </button>
      </div>

      <div className="mt-6 grid grid-cols-3 border-b border-slate-200">
        {tabs.map((t) => (
          <button key={t} onClick={() => cambiarTab(t)}
            className={`-mb-px border-b-2 pb-3 text-xs font-semibold ${tab === t ? 'border-brand text-brand' : 'border-transparent text-slate-700 hover:text-brand'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6 flex gap-6">
        <aside className="w-44 shrink-0 self-start rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-display text-xs font-semibold">Filtros de Búsqueda</h3>
            <button onClick={limpiar} className="text-[10px] font-semibold text-brand">Limpiar</button>
          </div>
          {grupos.map((g, i) => (
            <div key={g.key} className={`py-4 ${i < grupos.length - 1 ? 'border-b border-slate-200' : ''}`}>
              <p className="mb-3 text-[10px] font-bold tracking-wide text-slate-600">{g.titulo}</p>
              <div className="space-y-2.5">
                {g.ops.map(([label, n]) => (
                  <label key={label} className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-600">
                    <input type="checkbox" checked={filtros[g.key].includes(label)} onChange={() => toggle(g.key, label)} className="size-3.5 accent-brand" />
                    <span className="flex-1">{label}</span>
                    <span className="text-[10px] text-slate-400">({n})</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {visibles.length ? (
          <div className="grid flex-1 grid-cols-1 gap-4 self-start sm:grid-cols-2 xl:grid-cols-3">
            {visibles.map((p) => {
              const Icon = p.icon
              const limitado = p.stock.includes('Limitado')
              return (
                <article key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="grid size-10 place-items-center rounded-lg bg-blue-50 text-brand"><Icon size={18} /></div>
                    <span className={`rounded px-2 py-0.5 text-[9px] font-semibold ${limitado ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{p.stock}</span>
                  </div>
                  <h3 className="mt-3 truncate font-display text-[13px] font-semibold" title={p.nombre}>{p.nombre}</h3>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500">{p.desc}</p>
                  <p className="mt-3 text-[9px] font-semibold tracking-wide text-slate-400">PRECIO REF. UNITARIO</p>
                  <p className="font-display text-lg font-semibold">
                    USD ${fmt(p.precio)}{p.unidad && <span className="ml-1 text-[10px] font-normal text-slate-400">{p.unidad}</span>}
                  </p>
                  <button onClick={() => agregar(p)} className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-brand text-xs font-semibold text-white hover:bg-blue-700">
                    <Plus size={13} /> Agregar a cotización
                  </button>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center self-start rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <PackageSearch size={28} className="text-slate-400" />
            <p className="mt-3 font-display text-sm font-semibold">No encontramos productos</p>
            <p className="mt-1 text-xs text-slate-500">Prueba con otra búsqueda o quita algunos filtros.</p>
            <button onClick={limpiar} className="mt-4 h-8 rounded-lg border border-brand px-4 text-xs font-semibold text-brand hover:bg-blue-50">Limpiar filtros</button>
          </div>
        )}
      </div>
    </>
  )
}