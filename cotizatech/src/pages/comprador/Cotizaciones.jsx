import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useCotizaciones } from '../../context/CotizacionesContext.jsx'
import { calcular, fmt, fmtFecha } from '../../data/cotizaciones.js'
import EstadoBadge from '../../components/EstadoBadge.jsx'

const filtros = [['Todas', null], ['Pendientes', 'Pendiente'], ['Aprobadas', 'Aprobada'], ['Rechazadas', 'Rechazada'], ['Vencidas', 'Vencida']]
const POR_PAGINA = 7

export default function Cotizaciones() {
  const { cotizaciones, cambiarEstado } = useCotizaciones()
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState(null)
  const [pagina, setPagina] = useState(1)

  const lista = cotizaciones.filter((c) => !filtro || c.estado === filtro)
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA))
  const actual = Math.min(pagina, paginas)
  const filas = lista.slice((actual - 1) * POR_PAGINA, actual * POR_PAGINA)

  const elegir = (f) => { setFiltro(f); setPagina(1) }
  const btn = 'rounded-md px-3 py-1.5 text-[11px] font-semibold'

  return (
    <>
      <div className="mt-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-[28px] font-semibold">Historial de Cotizaciones</h1>
          <p className="mt-1 text-xs text-slate-500">Monitorea el estado de tus solicitudes, aprueba propuestas o descarga cotizaciones formales.</p>
        </div>
        <button onClick={() => navigate('/catalogo')} className="flex h-9 items-center gap-2 rounded-lg bg-brand px-5 text-xs font-semibold text-white hover:bg-blue-700">
          <Plus size={14} /> Nueva Solicitud
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {filtros.map(([label, estado]) => {
          const n = cotizaciones.filter((c) => !estado || c.estado === estado).length
          const activo = filtro === estado
          return (
            <button key={label} onClick={() => elegir(estado)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${activo ? 'border-brand bg-brand text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activo ? 'bg-white/20' : 'bg-slate-100'}`}>{n}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[820px] text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-600">
              <th className="px-5 py-4">Folio</th>
              <th className="px-3 py-4">Fecha</th>
              <th className="px-3 py-4">Cantidad ítems</th>
              <th className="px-3 py-4">Monto estimado</th>
              <th className="px-3 py-4">Estado</th>
              <th className="px-5 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((c) => {
              const { items, total } = calcular(c)
              return (
                <tr key={c.folio} className="border-t border-slate-100">
                  <td className="px-5 py-4"><Link to={`/cotizaciones/${c.folio}`} className="font-semibold text-brand hover:underline">#{c.folio}</Link></td>
                  <td className="px-3 py-4">{fmtFecha(c.fecha)}</td>
                  <td className="px-3 py-4 text-slate-600">{items} {items === 1 ? 'producto' : 'productos'}</td>
                  <td className="px-3 py-4 font-semibold">${fmt(total)} USD</td>
                  <td className="px-3 py-4"><EstadoBadge estado={c.estado} /></td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => navigate(`/cotizaciones/${c.folio}`)} className={`${btn} bg-slate-100 text-slate-600 hover:bg-slate-200`}>Ver detalle</button>
                      {c.estado === 'Pendiente' && (
                        <>
                          <button onClick={() => cambiarEstado(c.folio, 'Aprobada')} className={`${btn} bg-emerald-500 text-white hover:bg-emerald-600`}>Aprobar</button>
                          <button onClick={() => cambiarEstado(c.folio, 'Rechazada')} className={`${btn} bg-red-50 text-red-500 hover:bg-red-100`}>Rechazar</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {!filas.length && <tr><td colSpan={6} className="py-12 text-center text-slate-500">No hay cotizaciones en este estado.</td></tr>}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-xs text-slate-600">
          <span>Mostrando {filas.length} de {lista.length} cotizaciones</span>
          <div className="flex gap-2">
            <button disabled={actual === 1} onClick={() => setPagina(actual - 1)} className="rounded-md border border-slate-200 px-3 py-1.5 font-semibold hover:bg-slate-50 disabled:opacity-40">Anterior</button>
            <button disabled={actual === paginas} onClick={() => setPagina(actual + 1)} className="rounded-md border border-slate-200 px-3 py-1.5 font-semibold hover:bg-slate-50 disabled:opacity-40">Siguiente</button>
          </div>
        </div>
      </div>
    </>
  )
}
