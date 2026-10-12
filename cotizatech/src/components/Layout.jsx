import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCotizaciones } from '../context/CotizacionesContext.jsx'
import { fmt } from '../data/cotizaciones.js'
import { FileText, LayoutDashboard, ShoppingBag, UserCog, Search, Bell, ChevronDown, Plus, Minus, Trash2, X, CircleHelp, LogOut, CheckCircle2 } from 'lucide-react'

const iniciales = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
const notificaciones = [
  'Tu proveedor Dell respondió la cotización COT-00125.',
  'Nuevo producto homologado: Cisco Catalyst 9200L.',
]

export default function Layout() {
  const { user, logout } = useAuth()
  const { esAdmin, cotizaciones, busqueda, setBusqueda, count, total, lineas, cartOpen, setCartOpen, cambiarQty, quitar, enviar, toast, avisar } = useCotizaciones()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menu, setMenu] = useState(null)
  const pendientes = cotizaciones.filter((c) => c.estado === 'Pendiente').length
  const avisos = esAdmin
    ? [pendientes ? `Tienes ${pendientes} ${pendientes === 1 ? 'cotización pendiente' : 'cotizaciones pendientes'} por revisar.` : 'No tienes cotizaciones pendientes.']
    : notificaciones

  const buscar = (v) => {
    setBusqueda(v)
    if (pathname !== '/catalogo') navigate('/catalogo')
  }
  const onEnviar = () => {
    const folio = enviar()
    if (folio) navigate(`/cotizaciones/${folio}`)
  }

  const nav = [
    { label: 'Dashboard', icon: LayoutDashboard, soon: true },
    { label: 'Catálogo', icon: ShoppingBag, to: '/catalogo' },
    { label: 'Mis Cotizaciones', icon: FileText, to: '/cotizaciones' },
    { label: 'Perfil', icon: UserCog, soon: true },
  ]
    .filter((n) => !(esAdmin && n.to === '/catalogo'))
    .map((n) => (esAdmin && n.to === '/cotizaciones' ? { ...n, label: 'Cotizaciones' } : n))
  const base = 'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-medium'

  return (
    <div className="flex min-h-screen bg-navy">
      <aside className="hidden md:flex w-52 shrink-0 flex-col justify-between px-6 py-6 text-slate-300 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-lg bg-brand text-white"><FileText size={18} /></div>
            <span className="font-display text-xl font-bold text-white">CotizaTech</span>
            <span className="rounded bg-white/10 px-1.5 text-[9px] font-bold text-slate-200">ENT</span>
          </div>
          <nav className="mt-9 space-y-1">
            {nav.map(({ label, icon: Icon, to, soon }) =>
              soon ? (
                <button key={label} onClick={() => avisar(`${label} estará disponible próximamente`)} className={`${base} hover:bg-white/5`}>
                  <Icon size={15} /> {label}
                </button>
              ) : (
                <NavLink key={label} to={to} className={({ isActive }) => `${base} ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5'}`}>
                  <Icon size={15} /> {label}
                </NavLink>
              )
            )}
          </nav>
        </div>
        <div className="text-[11px] text-slate-400">
          <p className="flex items-center gap-1.5"><CircleHelp size={12} /> Soporte Enterprise</p>
          <p className="mt-2 text-[10px]">© 2026 CotizaTech Inc.</p>
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-slate-50 px-8 py-6">
        <header className="flex items-center justify-between border-b border-slate-200 pb-5 print:hidden">
          <div className={`${esAdmin ? 'hidden' : 'flex'} h-9 w-[358px] items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-brand`}>
            <Search size={14} className="text-slate-500" />
            <input value={busqueda} onChange={(e) => buscar(e.target.value)} placeholder="Buscar hardware, software, servicios..." className="w-full text-xs outline-none placeholder:text-slate-400" />
            {busqueda && <button onClick={() => setBusqueda('')} aria-label="Borrar búsqueda"><X size={13} className="text-slate-400" /></button>}
          </div>

          <div className="relative ml-auto flex items-center gap-3">
            <button className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold">ES <ChevronDown size={12} /></button>
            <button onClick={() => setMenu(menu === 'notif' ? null : 'notif')} className="relative grid size-8 place-items-center rounded-full border border-slate-200 bg-white" aria-label="Notificaciones">
              <Bell size={14} />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-red-500" />
            </button>
            <button onClick={() => setMenu(menu === 'user' ? null : 'user')} className="flex items-center gap-2.5 text-left">
              <div className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-blue-800 text-[11px] font-bold text-white">{iniciales(user.nombre)}</div>
              <div className="leading-tight">
                <p className="text-xs font-semibold">{user.nombre}</p>
                <p className="text-[10px] text-slate-500">{user.cargo}</p>
              </div>
            </button>

            {menu && <div className="fixed inset-0 z-10" onClick={() => setMenu(null)} />}
            {menu === 'notif' && (
              <div className="absolute right-24 top-11 z-20 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                {avisos.map((n) => <p key={n} className="rounded-lg px-3 py-2 text-xs text-slate-600 hover:bg-slate-50">{n}</p>)}
              </div>
            )}
            {menu === 'user' && (
              <div className="absolute right-0 top-11 z-20 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  <LogOut size={14} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        <Outlet />
      </main>

      {cartOpen && !esAdmin && (
        <div className="fixed inset-0 z-30 flex justify-end bg-slate-900/40" onClick={() => setCartOpen(false)}>
          <aside className="flex h-full w-full max-w-sm flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="font-display text-base font-semibold">Tu cotización ({count} items)</h2>
              <button onClick={() => setCartOpen(false)} aria-label="Cerrar"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5">
              {lineas.length ? lineas.map((l) => (
                <div key={l.id} className="flex items-center gap-3 border-b border-slate-100 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{l.nombre}</p>
                    <p className="text-[11px] text-slate-500">USD ${fmt(l.precio)}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-1.5 py-1">
                    <button onClick={() => cambiarQty(l.id, -1)} aria-label="Menos"><Minus size={12} /></button>
                    <span className="w-4 text-center text-xs font-semibold">{l.qty}</span>
                    <button onClick={() => cambiarQty(l.id, 1)} aria-label="Más"><Plus size={12} /></button>
                  </div>
                  <button onClick={() => quitar(l.id)} className="text-slate-400 hover:text-red-500" aria-label="Quitar"><Trash2 size={14} /></button>
                </div>
              )) : <p className="py-16 text-center text-xs text-slate-500">Tu cotización está vacía. Agrega productos desde el catálogo.</p>}
            </div>
            <div className="border-t border-slate-200 px-5 py-4">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Total referencial</span><span className="font-display font-semibold">USD ${fmt(total)}</span></div>
              <button onClick={onEnviar} disabled={!lineas.length} className="mt-4 h-9 w-full rounded-lg bg-brand text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">Enviar cotización</button>
            </div>
          </aside>
        </div>
      )}

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-medium text-white shadow-lg print:hidden">
          <CheckCircle2 size={14} className="text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  )
}