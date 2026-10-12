import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth, inicio } from '../../context/AuthContext.jsx'
import AuthLayout, { Campo, Mensajes } from '../../components/AuthLayout.jsx'
import { SECTORES } from '../../data/solicitudes.js'

const vacio = {
  empresa: '', nit: '', sector: '', direccion: '', ciudad: '', pais: 'Colombia', telefono: '', email: '',
  representante: '', cargo: '', password: '', confirmar: '', terminos: false,
}

export default function Registro() {
  const { user, registrar } = useAuth()
  const navigate = useNavigate()
  const [f, setF] = useState(vacio)
  const [error, setError] = useState('')

  if (user) return <Navigate to={inicio(user)} replace />

  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const campo = (k, label, placeholder, extra = {}) => (
    <Campo className="" label={label} placeholder={placeholder} value={f[k]} onChange={set(k)} {...extra} />
  )

  const onSubmit = (e) => {
    e.preventDefault()
    setError('')
    const faltan = Object.entries(f).some(([k, v]) => k !== 'terminos' && !String(v).trim())
    if (faltan) return setError('Completa todos los campos.')
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setError('Ingresa un correo electrónico válido.')
    if (f.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    if (f.password !== f.confirmar) return setError('Las contraseñas no coinciden.')
    if (!f.terminos) return setError('Debes aceptar los Términos de Servicio y la Política de Privacidad.')
    const r = registrar(f)
    if (!r.ok) return setError(r.error)
    navigate('/login', { state: { registrado: f.email.trim().toLowerCase() } })
  }

  return (
    <AuthLayout registro>
      <h2 className="mt-8 font-display text-[26px] font-semibold">Crea tu cuenta empresarial</h2>
      <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">Completa la información corporativa para acceder a la red de compras de TI.</p>

      <Mensajes error={error} />

      <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2" noValidate>
        {campo('empresa', 'Nombre de la Empresa', 'Tech Solutions S.A.')}
        <div>
          {campo('nit', 'NIT / RUT', '123456789-0')}
          <p className="mt-1 text-[10px] text-slate-400">Ej: 901.234.567-8</p>
        </div>
        <Campo className="" label="Sector o Industria">
          <select value={f.sector} onChange={set('sector')} className={`w-full bg-transparent text-xs outline-none ${f.sector ? '' : 'text-slate-500'}`}>
            <option value="">Selecciona un sector</option>
            {SECTORES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Campo>
        {campo('direccion', 'Dirección Corporativa', 'Av. Andrés Bello 1234, Of 501')}
        {campo('ciudad', 'Ciudad', 'Bogotá')}
        {campo('pais', 'País', 'Colombia')}
        {campo('telefono', 'Teléfono de Contacto', '+57 300 123 4567', { type: 'tel' })}
        {campo('email', 'Correo Electrónico Corporativo', 'compras@techsolutions.com', { type: 'email', autoComplete: 'username' })}
        {campo('representante', 'Nombre del Representante', 'Alejandro Mendoza')}
        {campo('cargo', 'Cargo del Representante', 'Director de Tecnología / CTO')}
        {campo('password', 'Contraseña', '••••••••••••', { type: 'password', autoComplete: 'new-password' })}
        {campo('confirmar', 'Confirmar Contraseña', '••••••••••••', { type: 'password', autoComplete: 'new-password' })}

        <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-600 sm:col-span-2">
          <input type="checkbox" checked={f.terminos} onChange={set('terminos')} className="mt-0.5 size-3.5 accent-brand" />
          <span>Acepto los <a href="#" className="font-semibold text-brand">Términos de Servicio</a> y la <a href="#" className="font-semibold text-brand">Política de Privacidad</a> de CotizaTech.</span>
        </label>

        <button type="submit" className="h-10 w-full rounded-lg bg-brand text-xs font-semibold text-white transition hover:bg-blue-700 sm:col-span-2">
          Crear Cuenta Empresarial
        </button>
      </form>

      <p className="mt-6 text-center text-[11px] text-slate-600">
        ¿Tu empresa ya está registrada? <Link to="/login" className="font-semibold text-brand">Iniciar sesión</Link>
      </p>
    </AuthLayout>
  )
}
