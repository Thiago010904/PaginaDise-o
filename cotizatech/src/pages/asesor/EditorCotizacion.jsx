import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Plus, Trash2, Send, Save, Download, AlertTriangle } from 'lucide-react'
import { useCotizaciones } from '../../context/CotizacionesContext.jsx'
import { calcularSolicitud, fmtCOP, fmtFechaCorta, itemDesdeProducto, productos, LIMITE_DESCUENTO } from '../../data/solicitudes.js'
import EstadoBadge from '../../components/EstadoBadge.jsx'

const VALIDECES = [15, 30, 45, 60]
const celda = 'w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-xs outline-none hover:border-slate-200 focus:border-brand focus:bg-white disabled:hover:border-transparent'

export default function EditorCotizacion() {
  const { id } = useParams()
  const { solicitudes } = useCotizaciones()
  const s = solicitudes.find((x) => x.id === id)

  if (!s) {
    return (
      <div className="mt-10 text-center">
        <p className="font-display text-lg font-semibold">No encontramos esa solicitud</p>
        <Link to="/asesor/solicitudes" className="mt-4 inline-block text-xs font-semibold text-brand">Volver a la bandeja</Link>
      </div>
    )
  }
  return <Editor key={s.id} s={s} />
}

function Editor({ s }) {
  const { actualizarSolicitud, avisar } = useCotizaciones()
  const navigate = useNavigate()
  const [items, setItems] = useState(s.items)
  const [notas, setNotas] = useState(s.notas)
  const [validez, setValidez] = useState(s.validez)
  const soloLectura = s.estado === 'Aprobada' || s.estado === 'Rechazada'

  const { lineas, subtotal, descuentos, iva, total } = calcularSolicitud({ items })
  const excedidos = items.filter((i) => i.descuento > LIMITE_DESCUENTO)

  const cambiar = (itemId, campo, valor) =>
    setItems((xs) => xs.map((i) => (i.id === itemId ? { ...i, [campo]: valor } : i)))
  const numero = (itemId, campo, max) => (e) => {
    const n = Math.max(0, Number(e.target.value.replace(/\D/g, '')) || 0)
    cambiar(itemId, campo, max ? Math.min(n, max) : n)
  }
  const agregar = (e) => {
    const v = e.target.value
    e.target.value = ''
    if (!v) return
    const nuevo = v === 'custom'
      ? { id: `c-${Date.now()}`, nombre: 'Nuevo ítem', desc: 'Descripción técnica', qty: 1, precio: 0, descuento: 0 }
      : itemDesdeProducto(productos.find((p) => p.id === Number(v)))
    setItems((xs) => [...xs, nuevo])
  }

  const guardar = (estado, mensaje) => {
    if (!items.length) return avisar('Agrega al menos un ítem a la cotización')
    actualizarSolicitud(s.id, { items, notas, validez, estado }, mensaje)
  }
  const enviarCliente = () => {
    if (excedidos.length) return avisar(`Hay descuentos por encima del ${LIMITE_DESCUENTO}% permitido`)
    if (items.some((i) => !i.qty || !i.precio)) return avisar('Todos los ítems deben tener cantidad y precio')
    guardar('Enviada', `Cotización enviada a ${s.cliente.email}`)
    navigate('/asesor/cotizaciones')
  }

  const info = [
    ['Empresa / Comprador', [s.cliente.nombre, `NIT: ${s.cliente.nit}`]],
    ['Contacto Corporativo', [s.cliente.contacto, s.cliente.email]],
    ['Ubicación de Despacho', [s.cliente.direccion, s.cliente.ciudad]],
  ]

  return (
    <>
      <nav className="mt-6 flex items-center gap-1.5 text-xs text-slate-500 print:hidden">
        <Link to="/asesor/cotizaciones" className="font-semibold hover:text-brand">Cotizaciones</Link>
        <ChevronRight size={12} />
        <span className="font-semibold text-ink">{s.id}</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[28px] font-semibold">Editor de Cotización</h1>
            <EstadoBadge estado={s.estado} />
          </div>
          <p className="mt-1 text-xs text-slate-500">Modifica los ítems, aplica descuentos con base en las directrices de margen, y envía la propuesta formal al cliente.</p>
        </div>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-sm font-semibold">Información de la Solicitud y Cliente</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {info.map(([titulo, lineasInfo]) => (
            <div key={titulo}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{titulo}</p>
              <p className="mt-1.5 text-xs font-semibold">{lineasInfo[0]}</p>
              <p className="text-[11px] text-slate-500">{lineasInfo[1]}</p>
            </div>
          ))}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Validez y Condiciones</p>
            <select value={validez} onChange={(e) => setValidez(Number(e.target.value))} disabled={soloLectura} className="mt-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold outline-none focus:border-brand">
              {VALIDECES.map((d) => <option key={d} value={d}>{d} días calendario</option>)}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">Moneda: COP ($) · Solicitada el {fmtFechaCorta(s.fecha)}</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <h2 className="font-display text-sm font-semibold">Ítems de Hardware, Software y Servicios de TI</h2>
          {!soloLectura && (
            <label className="relative flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-brand px-3 text-xs font-semibold text-brand hover:bg-blue-50 print:hidden">
              <Plus size={13} /> Agregar Ítem al Catálogo
              <select onChange={agregar} defaultValue="" className="absolute inset-0 cursor-pointer opacity-0" aria-label="Agregar ítem">
                <option value="">Selecciona un producto</option>
                <option value="custom">Ítem personalizado</option>
                {['Hardware', 'Software', 'Servicios'].map((t) => (
                  <optgroup key={t} label={t}>
                    {productos.filter((p) => p.tab === t).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                <th className="px-5 py-3">Producto / Servicio</th>
                <th className="px-3 py-3">Descripción Técnica</th>
                <th className="w-20 px-3 py-3 text-right">Cantidad</th>
                <th className="w-36 px-3 py-3 text-right">Precio Unitario (COP)</th>
                <th className="w-32 px-3 py-3 text-right">Descuento %</th>
                <th className="w-36 px-3 py-3 text-right">Subtotal (COP)</th>
                <th className="w-10 px-3 py-3 print:hidden" />
              </tr>
            </thead>
            <tbody>
              {lineas.map((l) => {
                const alerta = l.descuento > LIMITE_DESCUENTO ? 'text-red-600' : l.descuento >= LIMITE_DESCUENTO - 5 ? 'text-amber-600' : ''
                return (
                  <tr key={l.id} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-2"><input value={l.nombre} disabled={soloLectura} onChange={(e) => cambiar(l.id, 'nombre', e.target.value)} className={`${celda} font-semibold`} /></td>
                    <td className="px-3 py-2"><input value={l.desc} disabled={soloLectura} onChange={(e) => cambiar(l.id, 'desc', e.target.value)} className={`${celda} text-slate-500`} /></td>
                    <td className="px-3 py-2"><input inputMode="numeric" value={l.qty} disabled={soloLectura} onChange={numero(l.id, 'qty')} className={`${celda} text-right`} /></td>
                    <td className="px-3 py-2"><input inputMode="numeric" value={l.precio ? Math.round(l.precio).toLocaleString('es-CO') : ''} placeholder="0" disabled={soloLectura} onChange={numero(l.id, 'precio')} className={`${celda} text-right`} /></td>
                    <td className="px-3 py-2 text-right">
                      <input inputMode="numeric" value={l.descuento} disabled={soloLectura} onChange={numero(l.id, 'descuento', 100)} className={`${celda} text-right font-semibold ${alerta}`} />
                      {alerta && <p className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] font-semibold ${alerta}`}><AlertTriangle size={10} /> {l.descuento > LIMITE_DESCUENTO ? 'Supera el límite' : 'Alerta'}: Límite {LIMITE_DESCUENTO}%</p>}
                    </td>
                    <td className="px-3 py-3.5 text-right font-semibold">{fmtCOP(l.subtotal)}</td>
                    <td className="px-3 py-3 print:hidden">
                      {!soloLectura && <button onClick={() => setItems((xs) => xs.filter((i) => i.id !== l.id))} className="text-slate-400 hover:text-red-500" aria-label="Quitar ítem"><Trash2 size={14} /></button>}
                    </td>
                  </tr>
                )
              })}
              {!lineas.length && <tr><td colSpan={7} className="py-10 text-center text-slate-500">La cotización no tiene ítems. Agrega uno desde el catálogo.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-sm font-semibold">Notas y Condiciones Comerciales</h2>
          <p className="mt-1 text-[11px] text-slate-500">Este texto aparecerá al pie de la cotización PDF formal enviada al cliente corporativo.</p>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} disabled={soloLectura} rows={7}
            className="mt-3 w-full resize-y rounded-lg border border-slate-200 p-3 text-xs leading-relaxed outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-sm font-semibold">Resumen de Totales</h2>
          <div className="mt-4 space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-600"><span>Subtotal Ítems</span><span>{fmtCOP(subtotal)}</span></div>
            <div className="flex justify-between text-emerald-600"><span>Descuentos Aplicados</span><span>- {fmtCOP(descuentos)}</span></div>
            <div className="flex justify-between text-slate-600"><span>IVA (19%)</span><span>{fmtCOP(iva)}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-3 font-display text-base font-semibold"><span>TOTAL NETO</span><span>{fmtCOP(total)}</span></div>
          </div>
          {excedidos.length > 0 && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-600">
              <AlertTriangle size={13} className="mt-px shrink-0" /> {excedidos.length} {excedidos.length === 1 ? 'ítem supera' : 'ítems superan'} el descuento máximo del {LIMITE_DESCUENTO}%.
            </p>
          )}
          <div className="mt-5 space-y-2 print:hidden">
            {!soloLectura && (
              <button onClick={enviarCliente} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand text-xs font-semibold text-white hover:bg-blue-700">
                <Send size={14} /> {s.estado === 'Enviada' ? 'Re-enviar al Cliente' : 'Enviar al Cliente'}
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              {!soloLectura && (
                <button onClick={() => guardar(s.estado === 'Enviada' ? 'Enviada' : 'Borrador', 'Borrador guardado')} className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50">
                  <Save size={13} /> Guardar Borrador
                </button>
              )}
              <button onClick={() => window.print()} className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 ${soloLectura ? 'col-span-2' : ''}`}>
                <Download size={13} /> Exportar PDF
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
