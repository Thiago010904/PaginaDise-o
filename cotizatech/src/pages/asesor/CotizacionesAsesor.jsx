import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { asesorApi } from '../../api/asesor.js'
import { useApi } from '../../hooks/useApi.js'
import { fmtCOP, fmtFechaCorta } from '../../utils/formato.js'
import EstadoBadge from '../../components/EstadoBadge.jsx'

const TRABAJADAS = ['Borrador', 'Enviada', 'Aprobada', 'Rechazada', 'Vencida']
const filtros = ['Todas', ...TRABAJADAS]

// Cotizaciones que el asesor ya empezó a trabajar (todo lo que no está "Por Cotizar")
export default function CotizacionesAsesor() {
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState('Todas')

  const estado = filtro === 'Todas' ? TRABAJADAS.join(',') : filtro
  const { datos, cargando, error } = useApi(() => asesorApi.solicitudes({ estado, por_pagina: 100 }), [estado])
  const lista = datos?.items || []
  const conteos = datos?.conteos || {}
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
          const n = f === 'Todas' ? TRABAJADAS.reduce((a, e) => a + (conteos[e] || 0), 0) : conteos[f] || 0
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
              <tr key={s.folio} className="border-t border-slate-100">
                <td className="px-5 py-4"><Link to={`/asesor/cotizaciones/${s.folio}`} className="font-semibold text-brand hover:underline">{s.folio}</Link></td>
                <td className="px-3 py-4">
                  <p className="font-semibold">{s.cliente}</p>
                  <p className="text-[11px] text-slate-500">NIT: {s.nit}</p>
                </td>
                <td className="whitespace-nowrap px-3 py-4">{fmtFechaCorta(s.fecha)}</td>
                <td className="px-3 py-4 text-right font-semibold">{fmtCOP(s.total)}</td>
                <td className="px-3 py-4"><EstadoBadge estado={s.estado} /></td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => navigate(`/asesor/cotizaciones/${s.folio}`)} className={`${btn} ${s.estado === 'Borrador' ? 'border border-brand text-brand hover:bg-blue-50' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {s.estado === 'Borrador' ? 'Editar Borrador' : 'Ver detalle'}
                  </button>
                </td>
              </tr>
            ))}
            {!lista.length && (
              <tr><td colSpan={6} className={`py-12 text-center ${error ? 'text-red-600' : 'text-slate-500'}`}>
                {cargando ? 'Cargando...' : error ? error.message : 'No hay cotizaciones en este estado.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
