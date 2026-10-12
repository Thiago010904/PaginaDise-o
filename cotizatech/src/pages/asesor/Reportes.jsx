import { DollarSign, CheckCircle2, Percent, Receipt } from 'lucide-react'
import { useCotizaciones } from '../../context/CotizacionesContext.jsx'
import { agruparClientes, calcularSolicitud, fmtCOP, fmtMillones, ESTADOS_SOLICITUD } from '../../data/solicitudes.js'
import KpiCard from '../../components/KpiCard.jsx'
import EstadoBadge from '../../components/EstadoBadge.jsx'

export default function Reportes() {
  const { solicitudes } = useCotizaciones()
  const totalDe = (lista) => lista.reduce((a, s) => a + calcularSolicitud(s).total, 0)

  const porEstado = ESTADOS_SOLICITUD.map((e) => {
    const lista = solicitudes.filter((s) => s.estado === e)
    return { estado: e, n: lista.length, valor: totalDe(lista) }
  })
  const val = (e) => porEstado.find((x) => x.estado === e)
  const cerradas = val('Aprobada').n + val('Rechazada').n
  const tasa = cerradas ? Math.round((val('Aprobada').n / cerradas) * 100) : 0
  const cotizado = totalDe(solicitudes.filter((s) => s.estado !== 'Rechazada'))
  const ticket = val('Aprobada').n ? val('Aprobada').valor / val('Aprobada').n : 0
  const top = agruparClientes(solicitudes).slice(0, 5)

  return (
    <>
      <div className="mt-6">
        <h1 className="font-display text-[28px] font-semibold">Reportes de Ventas</h1>
        <p className="mt-1 text-xs text-slate-500">Resumen del desempeño comercial de tus cotizaciones de TI (valores en COP con IVA).</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={DollarSign} titulo="Valor Total Cotizado" valor={fmtMillones(cotizado)} unidad="COP" nota="Propuestas activas y cerradas" />
        <KpiCard icon={CheckCircle2} titulo="Valor Aprobado" valor={fmtMillones(val('Aprobada').valor)} unidad="COP" nota={`${val('Aprobada').n} contratos ganados`} notaClass="text-emerald-600" />
        <KpiCard icon={Percent} titulo="Tasa de Aprobación" valor={`${tasa}%`} nota={`Sobre ${cerradas} cotizaciones cerradas`} />
        <KpiCard icon={Receipt} titulo="Ticket Promedio" valor={fmtMillones(ticket)} unidad="COP" nota="Por contrato aprobado" />
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
              {porEstado.map((r) => (
                <tr key={r.estado} className="border-t border-slate-100">
                  <td className="px-5 py-3"><EstadoBadge estado={r.estado} /></td>
                  <td className="px-3 py-3 text-right">{r.n}</td>
                  <td className="px-5 py-3 text-right font-semibold">{fmtCOP(r.valor)}</td>
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
              {top.map((c, i) => (
                <tr key={c.nit} className="border-t border-slate-100">
                  <td className="px-5 py-3"><span className="mr-2 text-slate-400">{i + 1}.</span><span className="font-semibold">{c.corto}</span></td>
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
