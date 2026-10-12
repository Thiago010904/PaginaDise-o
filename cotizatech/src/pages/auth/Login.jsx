import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth, inicio } from '../../context/AuthContext.jsx'
import AuthLayout, { Campo, Mensajes } from '../../components/AuthLayout.jsx'
import { Mail, Lock, Eye, EyeOff, Globe } from 'lucide-react'

export default function Login() {
  const { user, login, loginSSO } = useAuth()
  const registrado = useLocation().state?.registrado
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState(registrado ? 'Empresa registrada. Ya puedes iniciar sesión.' : '')

  const [email, setEmail] = useState(registrado || '')
  const [password, setPassword] = useState('')

  if (user) return <Navigate to={inicio(user)} replace />

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

  const olvido = (e) => {
    e.preventDefault()
    setError('')
    setInfo(email ? `Enviamos instrucciones para restablecer tu contraseña a ${email}.` : 'Escribe tu correo corporativo para recuperar tu contraseña.')
  }

  const sso = () => {
    setLoading(true); setError(''); setInfo('')
    setTimeout(loginSSO, 700)
  }

  return (
    <AuthLayout>
      <h2 className="mt-8 font-display text-[26px] font-semibold">Ingresa a la plataforma</h2>
      <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">Ingresa tus credenciales corporativas para gestionar tus cotizaciones técnicas.</p>

      <Mensajes error={error} info={info} />

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
        ¿Tu empresa aún no utiliza CotizaTech? <Link to="/registro" className="font-semibold text-brand">Registrar empresa</Link>
      </p>
      <Link to="/registro" className="mt-3 grid h-9 w-full place-items-center rounded-lg border border-brand text-xs font-semibold text-brand hover:bg-blue-50">
        Registrar empresa
      </Link>
    </AuthLayout>
  )
}
