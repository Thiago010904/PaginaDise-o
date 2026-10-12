import { Link, useNavigate } from 'react-router-dom'
import { FileText, CheckCircle2, DollarSign, Clock, Plus, ShoppingBag, Cpu, XCircle, Send } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCotizaciones } from '../../context/CotizacionesContext.jsx'
import { calcular, fmt, fmtFecha } from '../../data/cotizaciones.js'
import EstadoBadge from '../../components/EstadoBadge.jsx'
import KpiCard from '../../components/KpiCard.jsx'

const actividad = {
  Aprobada: { icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600', texto: (f) => `Cotización #${f} aprobada por compras` },
  Pendiente: { icon: Send, color: 'bg-blue-50 text-brand', texto: (f) => `Has creado la solicitud de cotización #${f}` },
  Rechazada: { icon: XCircle, color: 'bg-red-50 text-red-500', texto: (f) => `Cotización #${f} rechazada` },
  Vencida: { icon: Clock, color: 'bg-slate-100 text-slate-500', texto: (f) => `La cotización #${f} venció` },
}

export default function Dashboard() {
  const { user } = useAuth()
  const { cotizaciones } = useCotizaciones()
  const navigate = useNavigate()

  const cuenta = (e) => cotizaciones.filter((c) => c.estado === e).length
  const aprobadas = cotizaciones.filter((c) => c.estado === 'Aprobada')
  const montoAprobado = aprobadas.reduce((a, c) => a + calcular(c).total, 0)
  const recientes = cotizaciones.slice(0, 5)

  return (
    <>
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-semibold">¡Bienvenido de vuelta, {user.empresa || user.nombre}!</h1>
          <p className="mt-1 text-xs text-slate-500">Gestiona tus compras tecnológicas y consulta el estado de tus cotizaciones.</p>
        </div>
        <button onClick={() => navigate('/catalogo')} className="flex h-9 items-center gap-2 rounded-lg bg-brand px-5 text-xs font-semibold text-white hover:bg-blue-700">
          <Plus size={14} /> Nueva Solicitud
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={FileText} titulo="Cotizaciones Activas" valor={cuenta('Pendiente') + aprobadas.length} nota="Pendientes y aprobadas vigentes" />
        <KpiCard icon={CheckCircle2} titulo="Aprobadas" valor={aprobadas.length} nota={`${Math.round((aprobadas.length / Math.max(1, cotizaciones.length)) * 100)}% de tus solicitudes`} notaClass="text-emerald-600" />
        <KpiCard icon={DollarSign} titulo="Monto Total Cotizado" valor={`$${fmt(montoAprobado)}`} unidad="USD" nota="En cotizaciones aprobadas" />
        <KpiCard icon={Clock} titulo="Solicitudes Pendientes" valor={cuenta('Pendiente')} nota="Esperan tu aprobación" notaClass="text-amber-600" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-display text-sm font-semibold">Cotizaciones Recientes</h2>
            <Link to="/cotizaciones" className="text-xs font-semibold text-brand">Ver todas</Link>
          </div>
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                <th className="px-5 py-3">Folio</th>
                <th className="px-3 py-3">Fecha</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {recientes.map((c) => (
                <tr key={c.folio} className="border-t border-slate-100">
                  <td className="px-5 py-3"><Link to={`/cotizaciones/${c.folio}`} className="font-semibold text-brand hover:underline">{c.folio}</Link></td>
                  <td className="px-3 py-3">{fmtFecha(c.fecha)}</td>
                  <td className="px-3 py-3"><EstadoBadge estado={c.estado} /></td>
                  <td className="px-5 py-3 text-right font-semibold">${fmt(calcular(c).total)}</td>
                </tr>
              ))}
              {!recientes.length && <tr><td colSpan={4} className="py-10 text-center text-slate-500">Aún no tienes cotizaciones.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-sm font-semibold">Accesos Rápidos</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={() => navigate('/catalogo')} className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 py-4 text-xs font-semibold hover:border-brand hover:text-brand">
                <Cpu size={18} /> Solicitar TI
              </button>
              <button onClick={() => navigate('/catalogo')} className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 py-4 text-xs font-semibold hover:border-brand hover:text-brand">
                <ShoppingBag size={18} /> Ver Catálogo
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-sm font-semibold">Actividad Reciente</h2>
            <ul className="mt-4 space-y-4">
              {recientes.slice(0, 4).map((c) => {
                const a = actividad[c.estado]
                return (
                  <li key={c.folio} className="flex gap-3">
                    <div className={`grid size-8 shrink-0 place-items-center rounded-full ${a.color}`}><a.icon size={14} /></div>
                    <div>
                      <p className="text-xs font-medium">{a.texto(c.folio)}</p>
                      <p className="text-[10px] text-slate-400">{fmtFecha(c.fecha)}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
