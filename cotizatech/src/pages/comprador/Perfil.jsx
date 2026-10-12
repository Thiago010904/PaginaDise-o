import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCotizaciones } from '../../context/CotizacionesContext.jsx'
import { Campo } from '../../components/AuthLayout.jsx'
import { SECTORES } from '../../data/solicitudes.js'

const CAMPOS = [
  ['empresa', 'Nombre de la Empresa'], ['nit', 'NIT / RUT'], ['direccion', 'Dirección Corporativa'], ['ciudad', 'Ciudad'],
  ['pais', 'País'], ['telefono', 'Teléfono de Contacto'], ['nombre', 'Nombre del Representante'], ['cargo', 'Cargo del Representante'],
]

export default function Perfil() {
  const { user, actualizarPerfil } = useAuth()
  const { avisar } = useCotizaciones()
  const [f, setF] = useState(() => Object.fromEntries([...CAMPOS.map(([k]) => [k, user[k] || '']), ['sector', user.sector || '']]))
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const guardar = (e) => {
    e.preventDefault()
    if (!f.nombre.trim() || !f.empresa.trim()) return avisar('El nombre de la empresa y del representante son obligatorios')
    actualizarPerfil(f)
    avisar('Perfil actualizado')
  }

  return (
    <>
      <div className="mt-6">
        <h1 className="font-display text-[28px] font-semibold">Mi Perfil</h1>
        <p className="mt-1 text-xs text-slate-500">Administra la información corporativa de tu empresa y del representante.</p>
      </div>

      <form onSubmit={guardar} className="mt-6 max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
          <div className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-blue-800 font-display text-base font-bold text-white">
            {(f.empresa || user.nombre).slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-display text-base font-semibold">{f.empresa || user.nombre}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {CAMPOS.map(([k, label]) => <Campo key={k} className="" label={label} value={f[k]} onChange={set(k)} />)}
          <Campo className="" label="Sector o Industria">
            <select value={f.sector} onChange={set('sector')} className="w-full bg-transparent text-xs outline-none">
              <option value="">Selecciona un sector</option>
              {[...new Set([...SECTORES, f.sector].filter(Boolean))].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Campo>
          <Campo className="" label="Correo Electrónico Corporativo" value={user.email} disabled />
        </div>

        <div className="mt-6 flex justify-end">
          <button type="submit" className="h-9 rounded-lg bg-brand px-6 text-xs font-semibold text-white hover:bg-blue-700">Guardar cambios</button>
        </div>
      </form>
    </>
  )
}
