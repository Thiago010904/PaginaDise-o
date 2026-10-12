import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import { useCotizaciones } from '../context/CotizacionesContext.jsx'
import { calcular, fmt, fmtFecha, sumarDias } from '../data/cotizaciones.js'
import EstadoBadge from '../components/EstadoBadge.jsx'

const mensajes = {
  Pendiente: 'Tu cotización está en revisión. El administrador la aprobará o rechazará pronto.',
  Aprobada: 'Cotización aprobada. Los proveedores procederán con la orden de compra.',
  Rechazada: 'Cotización rechazada. Puedes crear una nueva solicitud desde el catálogo.',
  Vencida: 'La vigencia de esta cotización terminó. Crea una nueva solicitud para actualizar precios.',
}

const mensajesAdmin = {
  Pendiente: 'Esta cotización espera tu decisión. Puedes aprobarla o rechazarla.',
  Aprobada: 'Aprobaste esta cotización.',
  Rechazada: 'Rechazaste esta cotización.',
  Vencida: 'La vigencia de esta cotización terminó.',
}

export default function CotizacionDetalle() {
  const { folio } = useParams()
  const { esAdmin, cotizaciones, cambiarEstado } = useCotizaciones()
  const c = cotizaciones.find((x) => x.folio === folio)

  if (!c) {
    return (
      <div className="mt-10 text-center">
        <p className="font-display text-lg font-semibold">No encontramos esa cotización</p>
        <Link to="/cotizaciones" className="mt-4 inline-block text-xs font-semibold text-brand">Volver al historial</Link>
      </div>
    )
  }

  const { lineas, subtotal, descuento, total, items } = calcular(c)
  const datos = [
    ['Fecha de solicitud', fmtFecha(c.fecha)],
    ['Válida hasta', fmtFecha(sumarDias(c.fecha, 15))],
    ['Solicitante', c.solicitante],
    ['Cantidad de ítems', `${items} ${items === 1 ? 'producto' : 'productos'}`],
  ]

  return (
    <>
      <Link to="/cotizaciones" className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand print:hidden">
        <ArrowLeft size={14} /> Volver al historial
      </Link>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[28px] font-semibold">Cotización #{c.folio}</h1>
            <EstadoBadge estado={c.estado} />
          </div>
          <p className="mt-1 text-xs text-slate-500">{esAdmin ? mensajesAdmin[c.estado] : mensajes[c.estado]}</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button onClick={() => window.print()} className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold hover:bg-slate-50">
            <Download size={14} /> Descargar PDF
          </button>
          {esAdmin && c.estado === 'Pendiente' && (
            <>
              <button onClick={() => cambiarEstado(c.folio, 'Rechazada')} className="h-9 rounded-lg bg-red-50 px-4 text-xs font-semibold text-red-500 hover:bg-red-100">Rechazar</button>
              <button onClick={() => cambiarEstado(c.folio, 'Aprobada')} className="h-9 rounded-lg bg-emerald-500 px-4 text-xs font-semibold text-white hover:bg-emerald-600">Aprobar</button>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {datos.map(([label, valor]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-semibold tracking-wide text-slate-400">{label.toUpperCase()}</p>
            <p className="mt-1 font-display text-sm font-semibold">{valor}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-600">
              <th className="px-5 py-4">Producto</th>
              <th className="px-3 py-4 text-right">Cantidad</th>
              <th className="px-3 py-4 text-right">Precio unitario</th>
              <th className="px-5 py-4 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((l) => {
              const Icon = l.icon
              return (
                <tr key={l.id} className="border-t border-slate-100">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid size-9 place-items-center rounded-lg bg-blue-50 text-brand"><Icon size={16} /></div>
                      <div>
                        <p className="font-semibold">{l.nombre}</p>
                        <p className="text-[11px] text-slate-500">{l.marca} · {l.sub}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">{l.qty}</td>
                  <td className="px-3 py-3 text-right">${fmt(l.precio)}</td>
                  <td className="px-5 py-3 text-right font-semibold">${fmt(l.precio * l.qty)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="ml-auto w-full max-w-xs space-y-2 border-t border-slate-100 px-5 py-4 text-xs">
          <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
          {descuento > 0 && <div className="flex justify-between text-emerald-600"><span>Descuento negociado</span><span>-${fmt(descuento)}</span></div>}
          <div className="flex justify-between border-t border-slate-200 pt-2 font-display text-sm font-semibold"><span>Monto estimado</span><span>${fmt(total)} USD</span></div>
        </div>
      </div>
    </>
  )
}