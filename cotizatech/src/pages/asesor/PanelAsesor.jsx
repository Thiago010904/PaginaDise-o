import { useNavigate } from 'react-router-dom'
import { Clock, CheckCircle2, DollarSign, Building2, SlidersHorizontal } from 'lucide-react'
import { asesorApi } from '../../api/asesor.js'
import { useApi } from '../../hooks/useApi.js'
import { fmtMillones } from '../../utils/formato.js'
import KpiCard from '../../components/KpiCard.jsx'
import SolicitudesTabla from '../../components/SolicitudesTabla.jsx'

export default function PanelAsesor() {
  const navigate = useNavigate()
  // KPIs y 4 solicitudes más recientes (GET /api/asesor/panel)
  const { datos: p, error, recargar } = useApi(() => asesorApi.panel(), [])

  return (
    <>
      <div className="mt-6">
        <h1 className="font-display text-[28px] font-semibold">Panel del Asesor</h1>
        <p className="mt-1 text-xs text-slate-500">Monitorea las solicitudes de compra tecnológicas entrantes y gestiona tus cotizaciones activas.</p>
      </div>

      {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">{error.message}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Clock} titulo="Cotizaciones Pendientes" valor={p ? p.pendientes : '—'} unidad="Solicitudes" nota="Requieren atención antes de 24 horas" notaClass="text-amber-600" />
        <KpiCard icon={CheckCircle2} titulo="Aprobadas" valor={p ? p.aprobadas : '—'} unidad="Contratos" nota="Propuestas aceptadas por los clientes" notaClass="text-emerald-600" />
        <KpiCard icon={DollarSign} titulo="Valor Total Cotizado" valor={fmtMillones(p?.valor_cotizado)} unidad="COP" nota="Acumulado de propuestas de TI activas" />
        <KpiCard icon={Building2} titulo="Clientes Activos" valor={p ? p.clientes_activos : '—'} unidad="Cuentas" nota="Empresas verificadas en Latinoamérica" />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <h2 className="font-display text-sm font-semibold">Bandeja de Solicitudes Recientes</h2>
            <p className="text-[11px] text-slate-500">Solicitudes de cotización técnica enviadas por empresas compradoras</p>
          </div>
          <button onClick={() => navigate('/asesor/solicitudes')} className="flex h-8 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold hover:bg-slate-50">
            <SlidersHorizontal size={13} /> Filtros Avanzados
          </button>
        </div>
        <SolicitudesTabla filas={p?.recientes || []} onCambio={recargar} vacio={p ? 'No hay solicitudes.' : 'Cargando...'} pie={
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-xs text-slate-600">
            <span>Mostrando {p?.recientes.length ?? 0} recientes · {p?.pendientes ?? 0} solicitudes pendientes</span>
            <button onClick={() => navigate('/asesor/solicitudes')} className="font-semibold text-brand">Ver bandeja completa</button>
          </div>
        } />
      </div>
    </>
  )
}
