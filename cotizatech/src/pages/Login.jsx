import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { FileText, Clock, ShieldCheck, TrendingDown, Mail, Lock, Eye, EyeOff, Globe, CircleHelp, ChevronDown, Building2, Hash, AlertCircle, CheckCircle2 } from 'lucide-react'

const stats = [
  { icon: Clock, value: '< 2 Horas', label: 'Tiempo promedio de respuesta en cotizaciones' },
  { icon: ShieldCheck, value: '99.8%', label: 'Proveedores de TI validados y certificados' },
  { icon: TrendingDown, value: '-18% Costos', label: 'Ahorro promedio en compras corporativas de TI' },
]

function Campo({ label, icon: Icon, right, ...props }) {
  return (
    <div className="mt-4 first:mt-0">
      <label className="text-xs font-semibold">{label}</label>
      <div className="mt-2 flex h-10 items-center gap-3 rounded-lg border border-slate-200 px-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
        <Icon size={15} className="text-slate-500" />
        <input {...props} className="w-full text-xs outline-none placeholder:text-slate-500" />
        {right}
      </div>
    </div>
  )
}

export default function Login() {
  const { user, login, loginSSO, registrar } = useAuth()
  const [tab, setTab] = useState('login')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [reg, setReg] = useState({ empresa: '', nit: '', email: '', password: '' })

  if (user) return <Navigate to={user.rol === 'admin' ? '/cotizaciones' : '/catalogo'} replace />

  const cambiarTab = (t) => { setTab(t); setError(''); setInfo('') }

  const onLogin = (e) => {
    e.preventDefault()
    setError(''); setInfo('')
    if (!email || !password) return setError('Ingresa tu correo y tu contraseña.')
    setLoading(true)
    setTimeout(() => {
      if (!login(email, password)) {
        setLoading(false)
        setError('Correo o contraseña incorrectos.')
      }
    }, 600)
  }

  const onRegistro = (e) => {
    e.preventDefault()
    setError(''); setInfo('')
    const { empresa, nit, email: correo, password: pass } = reg
    if (!empresa || !nit || !correo || !pass) return setError('Completa todos los campos.')
    if (pass.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    const r = registrar(reg)
    if (!r.ok) return setError(r.error)
    setEmail(correo); setPassword(''); setReg({ empresa: '', nit: '', email: '', password: '' })
    setTab('login')
    setInfo('Empresa registrada. Ya puedes iniciar sesión.')
  }

  const olvido = (e) => {
    e.preventDefault()
    setError('')
    setInfo(email ? `Enviamos instrucciones para restablecer tu contraseña a ${email}.` : 'Escribe tu correo corporativo para recuperar tu contraseña.')
  }

  const sso = () => {
    setLoading(true); setError(''); setInfo('')
    setTimeout(loginSSO, 700)
  }

  const esLogin = tab === 'login'

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
          <p className="mt-10 mb-3 text-[10px] font-semibold tracking-wider text-slate-400">RENDIMIENTO DE LA RED</p>
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
          <span className="flex items-center gap-1.5"><CircleHelp size={12} /> Soporte Enterprise</span>
        </div>
      </section>

      {/* Panel derecho */}
      <section className="relative flex justify-center px-8 py-12">
        <button className="absolute right-12 top-12 flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold">
          ES <ChevronDown size={12} />
        </button>

        <div className="w-full max-w-[346px] mt-24">
          <div className="grid grid-cols-2 gap-2">
            {[['login', 'Iniciar Sesión'], ['registro', 'Registro Empresarial']].map(([id, label]) => (
              <button key={id} onClick={() => cambiarTab(id)}
                className={`h-8 rounded-lg text-xs font-semibold border transition ${tab === id ? 'bg-brand text-white border-brand' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                {label}
              </button>
            ))}
          </div>

          <h2 className="mt-8 font-display text-[26px] font-semibold">{esLogin ? 'Ingresa a la plataforma' : 'Registra tu empresa'}</h2>
          <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
            {esLogin ? 'Ingresa tus credenciales corporativas para gestionar tus cotizaciones técnicas.' : 'Crea la cuenta corporativa para empezar a cotizar tecnología.'}
          </p>

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

          {esLogin ? (
            <>
              <form onSubmit={onLogin} className="mt-6" noValidate>
                <Campo label="Correo electrónico corporativo" icon={Mail} type="email" placeholder="nombre@empresa.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
                <Campo label="Contraseña" icon={Lock} type={show ? 'text' : 'password'} placeholder="••••••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
                  right={<button type="button" onClick={() => setShow(!show)} className="text-slate-500" aria-label="Mostrar contraseña">{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>} />

                <div className="mt-4 flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={remember} onChange={() => setRemember(!remember)} className="size-3.5 accent-brand" />
                    Recordar sesión
                  </label>
                  <a href="#" onClick={olvido} className="font-semibold text-brand">¿Olvidaste tu contraseña?</a>
                </div>

                <button type="submit" disabled={loading} className="mt-5 h-9 w-full rounded-lg bg-brand text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
                  {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                </button>
              </form>

              <div className="my-4 flex items-center gap-3 text-[10px] text-slate-500">
                <span className="h-px flex-1 bg-slate-200" /> o accede vía SSO <span className="h-px flex-1 bg-slate-200" />
              </div>

              <button onClick={sso} disabled={loading} className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 disabled:opacity-60">
                <Globe size={14} /> Ingresar con Google Workspace
              </button>

              <p className="mt-7 text-center text-[11px] text-slate-600">
                ¿Tu empresa aún no utiliza CotizaTech? <button onClick={() => cambiarTab('registro')} className="font-semibold text-brand">Registrar empresa</button>
              </p>
              <button onClick={() => cambiarTab('registro')} className="mt-3 h-9 w-full rounded-lg border border-brand text-xs font-semibold text-brand hover:bg-blue-50">
                Registrar empresa
              </button>
            </>
          ) : (
            <>
              <form onSubmit={onRegistro} className="mt-6" noValidate>
                <Campo label="Razón social" icon={Building2} placeholder="Mi Empresa S.A.S." value={reg.empresa} onChange={(e) => setReg({ ...reg, empresa: e.target.value })} />
                <Campo label="NIT / RUC" icon={Hash} placeholder="900123456-7" value={reg.nit} onChange={(e) => setReg({ ...reg, nit: e.target.value })} />
                <Campo label="Correo electrónico corporativo" icon={Mail} type="email" placeholder="nombre@empresa.com" value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} />
                <Campo label="Contraseña" icon={Lock} type="password" placeholder="Mínimo 8 caracteres" value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} />
                <button type="submit" className="mt-5 h-9 w-full rounded-lg bg-brand text-xs font-semibold text-white transition hover:bg-blue-700">Registrar empresa</button>
              </form>
              <p className="mt-6 text-center text-[11px] text-slate-600">
                ¿Ya tienes cuenta? <button onClick={() => cambiarTab('login')} className="font-semibold text-brand">Iniciar sesión</button>
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  )
}