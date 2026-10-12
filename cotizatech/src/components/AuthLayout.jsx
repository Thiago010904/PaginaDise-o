import { NavLink } from 'react-router-dom'
import { FileText, Clock, ShieldCheck, TrendingDown, CircleHelp, ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react'

const statsLogin = [
  { icon: Clock, value: '< 2 Horas', label: 'Tiempo promedio de respuesta en cotizaciones' },
  { icon: ShieldCheck, value: '99.8%', label: 'Proveedores de TI validados y certificados' },
  { icon: TrendingDown, value: '-18% Costos', label: 'Ahorro promedio en compras corporativas de TI' },
]
const statsRegistro = [
  { icon: Clock, value: '< 2 Horas', label: 'Tiempo promedio de respuesta en cotizaciones técnicas' },
  { icon: ShieldCheck, value: '99.8%', label: 'Proveedores corporativos validados y auditados' },
]

export function Campo({ label, icon: Icon, right, children, className = 'mt-4 first:mt-0', ...props }) {
  return (
    <div className={className}>
      <label className="text-xs font-semibold">{label}</label>
      <div className="mt-2 flex h-10 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
        {Icon && <Icon size={15} className="shrink-0 text-slate-500" />}
        {children || <input {...props} className="w-full min-w-0 bg-transparent text-xs outline-none placeholder:text-slate-500" />}
        {right}
      </div>
    </div>
  )
}

export function Mensajes({ error, info }) {
  return (
    <>
      {error && (
        <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle size={14} className="mt-px shrink-0" /> {error}
        </div>
      )}
      {info && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          <CheckCircle2 size={14} className="mt-px shrink-0" /> {info}
        </div>
      )}
    </>
  )
}

export default function AuthLayout({ registro = false, children }) {
  const stats = registro ? statsRegistro : statsLogin
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Panel izquierdo */}
      <section className="hidden lg:flex flex-col justify-between px-14 py-12 text-white bg-[radial-gradient(ellipse_at_30%_60%,#1d3a8a_0%,#0b1a4a_45%,#070f2c_100%)]">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center size-8 rounded-lg bg-brand"><FileText size={18} /></div>
          <span className="font-display text-xl font-bold">CotizaTech</span>
          <span className="text-[9px] font-semibold tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-slate-200">ENTERPRISE</span>
        </div>

        <div className="max-w-md">
          <h1 className="font-display text-[40px] leading-[1.1] font-semibold">Automatiza tus compras de tecnología</h1>
          <p className="mt-5 text-sm leading-relaxed text-slate-400">
            La plataforma líder para conectar empresas compradoras con los mejores proveedores de hardware, software y servicios de TI en Latinoamérica.
          </p>
          <p className="mt-10 mb-3 text-[10px] font-semibold tracking-wider text-slate-400">{registro ? 'RED DE PROVEEDORES CERTIFICADOS' : 'RENDIMIENTO DE LA RED'}</p>
          <div className="space-y-2.5">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={value} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                <div className="grid place-items-center size-9 rounded-full bg-white/10"><Icon size={16} /></div>
                <div>
                  <p className="font-display font-semibold">{value}</p>
                  <p className="text-[11px] text-slate-400">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between text-[11px] text-slate-400">
          <span>© 2026 CotizaTech Inc. Todos los derechos reservados.</span>
          {!registro && <span className="flex items-center gap-1.5"><CircleHelp size={12} /> Soporte Enterprise</span>}
        </div>
      </section>

      {/* Panel derecho */}
      <section className="relative flex justify-center px-4 py-12 sm:px-8">
        <div className="absolute right-4 top-6 flex items-center gap-4 sm:right-12 sm:top-12">
          {registro && <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500"><CircleHelp size={12} /> Soporte Enterprise</span>}
          <button className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold">
            ES <ChevronDown size={12} />
          </button>
        </div>

        <div className={`w-full ${registro ? 'max-w-[560px] mt-16' : 'max-w-[346px] mt-24'}`}>
          <div className={`grid grid-cols-2 gap-2 ${registro ? 'max-w-[346px]' : ''}`}>
            {[['/login', 'Iniciar Sesión'], ['/registro', 'Registro Empresarial']].map(([to, label]) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => `grid h-8 place-items-center rounded-lg text-xs font-semibold border transition ${isActive ? 'bg-brand text-white border-brand' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                {label}
              </NavLink>
            ))}
          </div>
          {children}
        </div>
      </section>
    </div>
  )
}
