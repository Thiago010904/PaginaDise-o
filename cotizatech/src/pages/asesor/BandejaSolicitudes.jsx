import { useState } from 'react'
import { Search } from 'lucide-react'
import { useCotizaciones } from '../../context/CotizacionesContext.jsx'
import { ESTADOS_SOLICITUD, resumen } from '../../data/solicitudes.js'
import SolicitudesTabla from '../../components/SolicitudesTabla.jsx'

const POR_PAGINA = 8

export default function BandejaSolicitudes() {
  const { solicitudes } = useCotizaciones()
  const [filtro, setFiltro] = useState(null)
  const [q, setQ] = useState('')
  const [pagina, setPagina] = useState(1)

  const texto = q.trim().toLowerCase()
  const lista = solicitudes.filter((s) =>
    (!filtro || s.estado === filtro) &&
    (!texto || `${s.cliente.nombre} ${s.cliente.nit} ${resumen(s)}`.toLowerCase().includes(texto)))
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA))
  const actual = Math.min(pagina, paginas)
  const filas = lista.slice((actual - 1) * POR_PAGINA, actual * POR_PAGINA)

  return (
    <>
      <div className="mt-6">
        <h1 className="font-display text-[28px] font-semibold">Bandeja de Solicitudes</h1>
        <p className="mt-1 text-xs text-slate-500">Todas las solicitudes de cotización técnica enviadas por las empresas compradoras.</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {[['Todas', null], ...ESTADOS_SOLICITUD.map((e) => [e, e])].map(([label, estado]) => {
          const n = solicitudes.filter((s) => !estado || s.estado === estado).length
          const activo = filtro === estado
          return (
            <button key={label} onClick={() => { setFiltro(estado); setPagina(1) }}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${activo ? 'border-brand bg-brand text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activo ? 'bg-white/20' : 'bg-slate-100'}`}>{n}</span>
            </button>
          )
        })}
        <div className="ml-auto flex h-9 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-brand sm:w-64">
          <Search size={14} className="text-slate-500" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPagina(1) }} placeholder="Buscar cliente, NIT o ítem..." className="w-full text-xs outline-none placeholder:text-slate-400" />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <SolicitudesTabla filas={filas} pie={
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-xs text-slate-600">
            <span>Mostrando {filas.length} de {lista.length} solicitudes</span>
            <div className="flex items-center gap-2">
              <button disabled={actual === 1} onClick={() => setPagina(actual - 1)} className="rounded-md border border-slate-200 px-3 py-1.5 font-semibold hover:bg-slate-50 disabled:opacity-40">Anterior</button>
              <span className="grid size-7 place-items-center rounded-md bg-brand font-semibold text-white">{actual}</span>
              <button disabled={actual === paginas} onClick={() => setPagina(actual + 1)} className="rounded-md border border-slate-200 px-3 py-1.5 font-semibold hover:bg-slate-50 disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        } />
      </div>
    </>
  )
}
