import { Link, useParams } from 'react-router-dom'
import { ChevronRight, Download, Info } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCotizaciones } from '../../context/CotizacionesContext.jsx'
import { calcular, fmt, fmtFecha, sumarDias } from '../../data/cotizaciones.js'
import EstadoBadge from '../../components/EstadoBadge.jsx'

const VALIDEZ = 30
const IVA = 0.19

const mensajes = {
  Pendiente: 'Revisa la propuesta y apruébala o recházala.',
  Aprobada: 'Cotización aprobada. Los proveedores procederán con la orden de compra.',
  Rechazada: 'Cotización rechazada. Puedes crear una nueva solicitud desde el catálogo.',
  Vencida: 'La vigencia de esta cotización terminó. Crea una nueva solicitud para actualizar precios.',
}

const PROVEEDOR = ['CotizaTech Enterprise LatAm', 'NIT: 901.123.456-7', 'Calle 100 #15-32, Of. 801, Bogotá, Colombia', 'contacto@cotizatech.com']

const terminos = [
  ['Validez de Oferta', `${VALIDEZ} días calendario (Sujeto a variación de TRM).`],
  ['Tiempos de Entrega', '10 a 15 días hábiles a partir de la orden de compra.'],
  ['Forma de Pago', 'Neto 45 días contra factura aprobada.'],
]

function Parte({ titulo, lineas }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-[10px] font-bold tracking-wide text-slate-400">{titulo}</p>
      <p className="mt-2 font-display text-sm font-semibold">{lineas[0]}</p>
      {lineas.slice(1).map((l) => <p key={l} className="mt-0.5 text-xs text-slate-500">{l}</p>)}
    </div>
  )
}

export default function CotizacionDetalle() {
  const { folio } = useParams()
  const { user } = useAuth()
  const { cotizaciones, cambiarEstado } = useCotizaciones()
  const c = cotizaciones.find((x) => x.folio === folio)

  if (!c) {
    return (
      <div className="mt-10 text-center">
        <p className="font-display text-lg font-semibold">No encontramos esa cotización</p>
        <Link to="/cotizaciones" className="mt-4 inline-block text-xs font-semibold text-brand">Volver al historial</Link>
      </div>
    )
  }

  const { lineas, subtotal, descuento, total } = calcular(c)
  const iva = total * IVA
  const cliente = [
    user.empresa || user.nombre,
    user.nit && `NIT: ${user.nit}`,
    [user.direccion, user.ciudad, user.pais].filter(Boolean).join(', '),
    user.email,
  ].filter(Boolean)

  return (
    <>
      <nav className="mt-6 flex items-center gap-1.5 text-xs text-slate-500 print:hidden">
        <Link to="/cotizaciones" className="font-semibold hover:text-brand">Cotizaciones</Link>
        <ChevronRight size={12} />
        <span className="font-semibold text-ink">#{c.folio}</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[28px] font-semibold">Cotización #{c.folio}</h1>
            <EstadoBadge estado={c.estado} />
          </div>
          <p className="mt-1 text-xs text-slate-500">Creado el {fmtFecha(c.fecha)} • Expira el {fmtFecha(sumarDias(c.fecha, VALIDEZ))} ({VALIDEZ} días calendario)</p>
          <p className="mt-1 text-xs text-slate-500">{mensajes[c.estado]}</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button onClick={() => window.print()} className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold hover:bg-slate-50">
            <Download size={14} /> Descargar PDF
          </button>
          {c.estado === 'Pendiente' && (
            <>
              <button onClick={() => cambiarEstado(c.folio, 'Rechazada')} className="h-9 rounded-lg bg-red-50 px-4 text-xs font-semibold text-red-500 hover:bg-red-100">Rechazar</button>
              <button onClick={() => cambiarEstado(c.folio, 'Aprobada')} className="h-9 rounded-lg bg-emerald-500 px-4 text-xs font-semibold text-white hover:bg-emerald-600">Aprobar Cotización</button>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Parte titulo="PROVEEDOR" lineas={PROVEEDOR} />
        <Parte titulo="CLIENTE" lineas={cliente} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[680px] text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-600">
              <th className="px-5 py-4">Nº</th>
              <th className="px-3 py-4">Producto / Servicio</th>
              <th className="px-3 py-4 text-right">Cant.</th>
              <th className="px-3 py-4 text-right">Precio Unit.</th>
              <th className="px-5 py-4 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((l, i) => {
              const Icon = l.icon
              return (
                <tr key={l.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 text-slate-500">{String(i + 1).padStart(2, '0')}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-brand"><Icon size={16} /></div>
                      <div>
                        <p className="font-semibold">{l.nombre}</p>
                        <p className="text-[11px] text-slate-500">{l.desc}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">{l.qty}</td>
                  <td className="px-3 py-3 text-right">${fmt(l.precio)} USD</td>
                  <td className="px-5 py-3 text-right font-semibold">${fmt(l.precio * l.qty)} USD</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-display text-sm font-semibold">Términos y Condiciones Comerciales</h3>
          <dl className="mt-3 space-y-2 text-xs">
            {terminos.map(([k, v]) => (
              <div key={k} className="flex flex-wrap gap-1"><dt className="font-semibold">{k}:</dt><dd className="text-slate-600">{v}</dd></div>
            ))}
          </dl>
        </div>
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-5 text-xs">
          <div className="flex justify-between text-slate-600"><span>Subtotal General</span><span>${fmt(subtotal)} USD</span></div>
          <div className="flex justify-between text-emerald-600"><span>Descuento Consolidado</span><span>-${fmt(descuento)} USD</span></div>
          <div className="flex justify-between text-slate-600"><span>IVA Colombia (19%)</span><span>${fmt(iva)} USD</span></div>
          <div className="flex justify-between border-t border-slate-200 pt-2 font-display text-sm font-semibold"><span>TOTAL ESTIMADO</span><span>${fmt(total + iva)} USD</span></div>
        </div>
      </div>

      {c.estado === 'Pendiente' && (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-[11px] text-slate-600 print:hidden">
          <Info size={14} className="mt-px shrink-0 text-brand" />
          Al hacer clic en Aprobar Cotización, se generará un documento formal de aceptación vinculado a su cuenta y se iniciará la preparación de la orden.
        </p>
      )}
    </>
  )
}
