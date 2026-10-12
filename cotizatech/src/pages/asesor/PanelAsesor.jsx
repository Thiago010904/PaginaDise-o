import { useNavigate } from 'react-router-dom'
import { Clock, CheckCircle2, DollarSign, Building2, SlidersHorizontal } from 'lucide-react'
import { useCotizaciones } from '../../context/CotizacionesContext.jsx'
import { calcularSolicitud, fmtMillones } from '../../data/solicitudes.js'
import KpiCard from '../../components/KpiCard.jsx'
import SolicitudesTabla from '../../components/SolicitudesTabla.jsx'

export default function PanelAsesor() {
  const { solicitudes } = useCotizaciones()
  const navigate = useNavigate()

  const pendientes = solicitudes.filter((s) => s.estado === 'Por Cotizar' || s.estado === 'Borrador')
  const aprobadas = solicitudes.filter((s) => s.estado === 'Aprobada').length
  const activas = solicitudes.filter((s) => s.estado !== 'Rechazada')
  const valor = activas.reduce((a, s) => a + calcularSolicitud(s).total, 0)
  const clientes = new Set(solicitudes.map((s) => s.cliente.nit)).size
  const recientes = solicitudes.slice(0, 4)

  return (
    <>
      <div className="mt-6">
        <h1 className="font-display text-[28px] font-semibold">Panel del Asesor</h1>
        <p className="mt-1 text-xs text-slate-500">Monitorea las solicitudes de compra tecnológicas entrantes y gestiona tus cotizaciones activas.</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Clock} titulo="Cotizaciones Pendientes" valor={pendientes.length} unidad="Solicitudes" nota="Requieren atención antes de 24 horas" notaClass="text-amber-600" />
        <KpiCard icon={CheckCircle2} titulo="Aprobadas este mes" valor={aprobadas} unidad="Contratos" nota="Propuestas aceptadas por los clientes" notaClass="text-emerald-600" />
        <KpiCard icon={DollarSign} titulo="Valor Total Cotizado" valor={fmtMillones(valor)} unidad="COP" nota="Acumulado de propuestas de TI activas" />
        <KpiCard icon={Building2} titulo="Clientes Activos" valor={clientes} unidad="Cuentas" nota="Empresas verificadas en Latinoamérica" />
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
        <SolicitudesTabla filas={recientes} pie={
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-xs text-slate-600">
            <span>Mostrando {recientes.length} de {pendientes.length} solicitudes pendientes</span>
            <button onClick={() => navigate('/asesor/solicitudes')} className="font-semibold text-brand">Ver bandeja completa</button>
          </div>
        } />
      </div>
    </>
  )
}
