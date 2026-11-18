import { DollarSign, CheckCircle2, Percent, Receipt } from 'lucide-react'
import { asesorApi } from '../../api/asesor.js'
import { useApi } from '../../hooks/useApi.js'
import { fmtCOP, fmtMillones } from '../../utils/formato.js'
import KpiCard from '../../components/KpiCard.jsx'
import EstadoBadge from '../../components/EstadoBadge.jsx'

export default function Reportes() {
  // Totales por estado, KPIs y top 5 clientes calculados en el back (GET /api/asesor/reportes)
  const { datos: r, error } = useApi(() => asesorApi.reportes(), [])
  const k = r?.kpis
  const aprobadas = r?.por_estado.find((x) => x.estado === 'Aprobada')

  return (
    <>
      <div className="mt-6">
        <h1 className="font-display text-[28px] font-semibold">Reportes de Ventas</h1>
        <p className="mt-1 text-xs text-slate-500">Resumen del desempeño comercial de tus cotizaciones de TI (valores en COP con IVA).</p>
      </div>

      {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">{error.message}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={DollarSign} titulo="Valor Total Cotizado" valor={fmtMillones(k?.valor_cotizado)} unidad="COP" nota="Propuestas activas y cerradas" />
        <KpiCard icon={CheckCircle2} titulo="Valor Aprobado" valor={fmtMillones(k?.valor_aprobado)} unidad="COP" nota={`${k?.contratos_ganados ?? 0} contratos ganados`} notaClass="text-emerald-600" />
        <KpiCard icon={Percent} titulo="Tasa de Aprobación" valor={`${k?.tasa_aprobacion ?? 0}%`} nota={`Sobre ${k?.cerradas ?? 0} cotizaciones cerradas`} />
        <KpiCard icon={Receipt} titulo="Ticket Promedio" valor={fmtMillones(k?.ticket_promedio)} unidad="COP" nota={`Por contrato aprobado (${aprobadas?.n ?? 0})`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <h2 className="px-5 py-4 font-display text-sm font-semibold">Solicitudes por Estado</h2>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                <th className="px-5 py-3">Estado</th>
                <th className="px-3 py-3 text-right">Cantidad</th>
                <th className="px-5 py-3 text-right">Valor (COP)</th>
              </tr>
            </thead>
            <tbody>
              {(r?.por_estado || []).map((x) => (
                <tr key={x.estado} className="border-t border-slate-100">
                  <td className="px-5 py-3"><EstadoBadge estado={x.estado} /></td>
                  <td className="px-3 py-3 text-right">{x.n}</td>
                  <td className="px-5 py-3 text-right font-semibold">{fmtCOP(x.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <h2 className="px-5 py-4 font-display text-sm font-semibold">Top 5 Clientes por Valor Cotizado</h2>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                <th className="px-5 py-3">Cliente</th>
                <th className="px-3 py-3 text-right">Solicitudes</th>
                <th className="px-5 py-3 text-right">Valor (COP)</th>
              </tr>
            </thead>
            <tbody>
              {(r?.top_clientes || []).map((c, i) => (
                <tr key={c.empresa_id} className="border-t border-slate-100">
                  <td className="px-5 py-3"><span className="mr-2 text-slate-400">{i + 1}.</span><span className="font-semibold">{c.nombre}</span></td>
                  <td className="px-3 py-3 text-right">{c.solicitudes}</td>
                  <td className="px-5 py-3 text-right font-semibold">{fmtCOP(c.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
