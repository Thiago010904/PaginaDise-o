import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { asesorApi } from '../../api/asesor.js'
import { useApi } from '../../hooks/useApi.js'
import { ESTADOS_SOLICITUD } from '../../utils/formato.js'
import SolicitudesTabla from '../../components/SolicitudesTabla.jsx'

const POR_PAGINA = 8

export default function BandejaSolicitudes() {
  const [filtro, setFiltro] = useState(null)
  const [q, setQ] = useState('')
  const [busqueda, setBusqueda] = useState('')   // texto que de verdad se manda al back
  const [pagina, setPagina] = useState(1)

  // Espera 300 ms después de la última tecla para no llamar al back en cada letra
  useEffect(() => {
    const t = setTimeout(() => { setBusqueda(q.trim()); setPagina(1) }, 300)
    return () => clearTimeout(t)
  }, [q])

  // El back filtra (estado + texto), pagina y devuelve "conteos" por estado
  const { datos, cargando, error, recargar } = useApi(
    () => asesorApi.solicitudes({ estado: filtro, q: busqueda, pagina, por_pagina: POR_PAGINA }),
    [filtro, busqueda, pagina],
  )
  const filas = datos?.items || []
  const conteos = datos?.conteos || {}
  const totalTodas = Object.values(conteos).reduce((a, n) => a + n, 0)
  const paginas = Math.max(1, Math.ceil((datos?.total || 0) / POR_PAGINA))

  return (
    <>
      <div className="mt-6">
        <h1 className="font-display text-[28px] font-semibold">Bandeja de Solicitudes</h1>
        <p className="mt-1 text-xs text-slate-500">Todas las solicitudes de cotización técnica enviadas por las empresas compradoras.</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {[['Todas', null], ...ESTADOS_SOLICITUD.map((e) => [e, e])].map(([label, estado]) => {
          const n = estado ? conteos[estado] || 0 : totalTodas
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
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente, NIT, folio o ítem..." className="w-full text-xs outline-none placeholder:text-slate-400" />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <SolicitudesTabla filas={filas} onCambio={recargar}
          vacio={cargando ? 'Cargando...' : error ? error.message : 'No hay solicitudes en este estado.'}
          pie={
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-xs text-slate-600">
              <span>Mostrando {filas.length} de {datos?.total ?? 0} solicitudes</span>
              <div className="flex items-center gap-2">
                <button disabled={pagina === 1} onClick={() => setPagina(pagina - 1)} className="rounded-md border border-slate-200 px-3 py-1.5 font-semibold hover:bg-slate-50 disabled:opacity-40">Anterior</button>
                <span className="grid size-7 place-items-center rounded-md bg-brand font-semibold text-white">{pagina}</span>
                <button disabled={pagina >= paginas} onClick={() => setPagina(pagina + 1)} className="rounded-md border border-slate-200 px-3 py-1.5 font-semibold hover:bg-slate-50 disabled:opacity-40">Siguiente</button>
              </div>
            </div>
          } />
      </div>
    </>
  )
}
