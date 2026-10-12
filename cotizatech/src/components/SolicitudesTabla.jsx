import { useNavigate } from 'react-router-dom'
import { useCotizaciones } from '../context/CotizacionesContext.jsx'
import { fmtFechaCorta, resumen } from '../data/solicitudes.js'
import EstadoBadge from './EstadoBadge.jsx'

const btn = 'whitespace-nowrap rounded-md px-3 py-1.5 text-[11px] font-semibold'

// Tabla de solicitudes del asesor con las acciones según el estado
export default function SolicitudesTabla({ filas, pie }) {
  const { actualizarSolicitud, avisar } = useCotizaciones()
  const navigate = useNavigate()
  const abrir = (s) => navigate(`/asesor/cotizaciones/${s.id}`)

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-xs">
        <thead>
          <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-600">
            <th className="px-5 py-4">Cliente</th>
            <th className="px-3 py-4">Fecha Solicitud</th>
            <th className="px-3 py-4">Ítems Solicitados (Resumen)</th>
            <th className="px-3 py-4">Estado</th>
            <th className="px-5 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((s) => (
            <tr key={s.id} className="border-t border-slate-100">
              <td className="px-5 py-4">
                <p className="font-semibold">{s.cliente.corto}</p>
                <p className="text-[11px] text-slate-500">NIT: {s.cliente.nit}</p>
              </td>
              <td className="whitespace-nowrap px-3 py-4">{fmtFechaCorta(s.fecha)}</td>
              <td className="max-w-[340px] px-3 py-4 text-slate-600"><p className="line-clamp-2">{resumen(s)}</p></td>
              <td className="px-3 py-4"><EstadoBadge estado={s.estado} /></td>
              <td className="px-5 py-3">
                <div className="flex justify-end gap-2">
                  {s.estado === 'Por Cotizar' && (
                    <>
                      <button onClick={() => actualizarSolicitud(s.id, { estado: 'Rechazada' }, `Solicitud de ${s.cliente.corto} rechazada`)} className={`${btn} bg-red-50 text-red-500 hover:bg-red-100`}>Rechazar</button>
                      <button onClick={() => abrir(s)} className={`${btn} bg-brand text-white hover:bg-blue-700`}>Cotizar</button>
                    </>
                  )}
                  {s.estado === 'Borrador' && <button onClick={() => abrir(s)} className={`${btn} border border-brand text-brand hover:bg-blue-50`}>Editar Borrador</button>}
                  {s.estado === 'Enviada' && <button onClick={() => avisar(`PDF re-enviado a ${s.cliente.email}`)} className={`${btn} bg-slate-100 text-slate-600 hover:bg-slate-200`}>Re-enviar PDF</button>}
                  {(s.estado === 'Aprobada' || s.estado === 'Rechazada') && <button onClick={() => abrir(s)} className={`${btn} bg-slate-100 text-slate-600 hover:bg-slate-200`}>Ver detalle</button>}
                </div>
              </td>
            </tr>
          ))}
          {!filas.length && <tr><td colSpan={5} className="py-12 text-center text-slate-500">No hay solicitudes en este estado.</td></tr>}
        </tbody>
      </table>
      {pie}
    </div>
  )
}
