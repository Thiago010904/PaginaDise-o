import { useEffect, useState } from 'react'
import { Search, Mail } from 'lucide-react'
import { useCotizaciones } from '../../context/CotizacionesContext.jsx'
import { asesorApi } from '../../api/asesor.js'
import { useApi } from '../../hooks/useApi.js'
import { fmtCOP, fmtFechaCorta } from '../../utils/formato.js'

export default function Clientes() {
  const { avisar } = useCotizaciones()
  const [q, setQ] = useState('')
  const [busqueda, setBusqueda] = useState('')

  // Espera 300 ms después de la última tecla antes de buscar en el back
  useEffect(() => {
    const t = setTimeout(() => setBusqueda(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  // Resumen por empresa calculado en la base (vista v_clientes_resumen)
  const { datos, cargando, error } = useApi(() => asesorApi.clientes(busqueda), [busqueda])
  const clientes = datos?.items || []

  return (
    <>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-semibold">Mis Clientes</h1>
          <p className="mt-1 text-xs text-slate-500">Empresas compradoras verificadas que han solicitado cotizaciones contigo.</p>
        </div>
        <div className="flex h-9 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-brand sm:w-72">
          <Search size={14} className="text-slate-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar empresa o NIT..." className="w-full text-xs outline-none placeholder:text-slate-400" />
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-600">
              <th className="px-5 py-4">Empresa</th>
              <th className="px-3 py-4">Contacto</th>
              <th className="px-3 py-4">Sector / Ciudad</th>
              <th className="px-3 py-4 text-right">Solicitudes</th>
              <th className="px-3 py-4 text-right">Valor Cotizado</th>
              <th className="px-3 py-4">Última Solicitud</th>
              <th className="px-5 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.empresa_id} className="border-t border-slate-100">
                <td className="px-5 py-4">
                  <p className="font-semibold">{c.nombre}</p>
                  <p className="text-[11px] text-slate-500">NIT: {c.nit}</p>
                </td>
                <td className="px-3 py-4">
                  <p>{c.contacto}</p>
                  <p className="text-[11px] text-slate-500">{c.email}</p>
                </td>
                <td className="px-3 py-4">
                  <p>{c.sector}</p>
                  <p className="text-[11px] text-slate-500">{c.ciudad}</p>
                </td>
                <td className="px-3 py-4 text-right">{c.solicitudes} <span className="text-[11px] text-emerald-600">({c.aprobadas} aprob.)</span></td>
                <td className="px-3 py-4 text-right font-semibold">{fmtCOP(c.valor)}</td>
                <td className="whitespace-nowrap px-3 py-4">{fmtFechaCorta(c.ultima)}</td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => avisar(`Correo preparado para ${c.contacto} (simulado)`)} className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-200">
                    <Mail size={12} /> Contactar
                  </button>
                </td>
              </tr>
            ))}
            {!clientes.length && (
              <tr><td colSpan={7} className={`py-12 text-center ${error ? 'text-red-600' : 'text-slate-500'}`}>
                {cargando ? 'Cargando...' : error ? error.message : 'No encontramos clientes con esa búsqueda.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
