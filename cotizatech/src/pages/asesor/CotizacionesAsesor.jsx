import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCotizaciones } from '../../context/CotizacionesContext.jsx'
import { calcularSolicitud, fmtCOP, fmtFechaCorta } from '../../data/solicitudes.js'
import EstadoBadge from '../../components/EstadoBadge.jsx'

const filtros = ['Todas', 'Borrador', 'Enviada', 'Aprobada', 'Rechazada']

// Cotizaciones que el asesor ya empezó a trabajar (todo lo que no está "Por Cotizar")
export default function CotizacionesAsesor() {
  const { solicitudes } = useCotizaciones()
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState('Todas')

  const trabajadas = solicitudes.filter((s) => s.estado !== 'Por Cotizar')
  const lista = trabajadas.filter((s) => filtro === 'Todas' || s.estado === filtro)
  const btn = 'whitespace-nowrap rounded-md px-3 py-1.5 text-[11px] font-semibold'

  return (
    <>
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-semibold">Editor / Cotizaciones</h1>
          <p className="mt-1 text-xs text-slate-500">Retoma tus borradores, revisa las propuestas enviadas y consulta las cerradas.</p>
        </div>
        <button onClick={() => navigate('/asesor/solicitudes')} className="h-9 rounded-lg bg-brand px-5 text-xs font-semibold text-white hover:bg-blue-700">
          Cotizar nueva solicitud
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {filtros.map((f) => {
          const n = trabajadas.filter((s) => f === 'Todas' || s.estado === f).length
          const activo = filtro === f
          return (
            <button key={f} onClick={() => setFiltro(f)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${activo ? 'border-brand bg-brand text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
              {f}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activo ? 'bg-white/20' : 'bg-slate-100'}`}>{n}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-600">
              <th className="px-5 py-4">Solicitud</th>
              <th className="px-3 py-4">Cliente</th>
              <th className="px-3 py-4">Fecha</th>
              <th className="px-3 py-4 text-right">Total Neto (COP)</th>
              <th className="px-3 py-4">Estado</th>
              <th className="px-5 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="px-5 py-4"><Link to={`/asesor/cotizaciones/${s.id}`} className="font-semibold text-brand hover:underline">{s.id}</Link></td>
                <td className="px-3 py-4">
                  <p className="font-semibold">{s.cliente.corto}</p>
                  <p className="text-[11px] text-slate-500">NIT: {s.cliente.nit}</p>
                </td>
                <td className="whitespace-nowrap px-3 py-4">{fmtFechaCorta(s.fecha)}</td>
                <td className="px-3 py-4 text-right font-semibold">{fmtCOP(calcularSolicitud(s).total)}</td>
                <td className="px-3 py-4"><EstadoBadge estado={s.estado} /></td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => navigate(`/asesor/cotizaciones/${s.id}`)} className={`${btn} ${s.estado === 'Borrador' ? 'border border-brand text-brand hover:bg-blue-50' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {s.estado === 'Borrador' ? 'Editar Borrador' : s.estado === 'Enviada' ? 'Abrir en editor' : 'Ver detalle'}
                  </button>
                </td>
              </tr>
            ))}
            {!lista.length && <tr><td colSpan={6} className="py-12 text-center text-slate-500">No hay cotizaciones en este estado.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}
