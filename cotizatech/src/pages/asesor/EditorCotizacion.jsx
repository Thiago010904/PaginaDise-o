import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Plus, Trash2, Send, Save, Download, AlertTriangle, Lock } from 'lucide-react'
import { useCotizaciones } from '../../context/CotizacionesContext.jsx'
import { asesorApi } from '../../api/asesor.js'
import { productosApi } from '../../api/catalogo.js'
import { useApi } from '../../hooks/useApi.js'
import { fmtCOP, fmtFechaCorta } from '../../utils/formato.js'
import EstadoBadge from '../../components/EstadoBadge.jsx'

const VALIDECES = [15, 30, 45, 60]
const celda = 'w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-xs outline-none hover:border-slate-200 focus:border-brand focus:bg-white disabled:hover:border-transparent'

let siguienteClave = 0
const conClave = (i) => ({ ...i, clave: `i${siguienteClave++}` })

// Vista previa de totales mientras se edita (misma fórmula que la estrategia del back:
// descuento % por línea + IVA). El valor oficial siempre lo calcula y valida el back al guardar/enviar.
function calcularVistaPrevia(items, ivaPct) {
  const lineas = items.map((i) => {
    const bruto = i.cantidad * i.precio_unitario
    const desc = (bruto * i.descuento_pct) / 100
    return { ...i, subtotal: bruto - desc, bruto, desc }
  })
  const subtotal = lineas.reduce((a, l) => a + l.bruto, 0)
  const descuentos = lineas.reduce((a, l) => a + l.desc, 0)
  const iva = ((subtotal - descuentos) * ivaPct) / 100
  return { lineas, subtotal, descuentos, iva, total: subtotal - descuentos + iva }
}

export default function EditorCotizacion() {
  const { folio } = useParams()
  const { datos: s, cargando, error } = useApi(() => asesorApi.solicitud(folio), [folio])

  if (cargando && !s) return <p className="mt-10 text-center text-xs text-slate-500">Cargando solicitud...</p>
  if (error) {
    return (
      <div className="mt-10 text-center">
        <p className="font-display text-lg font-semibold">{error.status === 404 ? 'No encontramos esa solicitud' : error.message}</p>
        <Link to="/asesor/solicitudes" className="mt-4 inline-block text-xs font-semibold text-brand">Volver a la bandeja</Link>
      </div>
    )
  }
  return <Editor key={`${s.folio}-${s.estado}`} inicial={s} />
}

function Editor({ inicial }) {
  const { avisar, avisarError } = useCotizaciones()
  const navigate = useNavigate()
  const [s, setS] = useState(inicial)
  const [items, setItems] = useState(() => inicial.items.map(conClave))
  const [notas, setNotas] = useState(inicial.notas || '')
  const [validez, setValidez] = useState(inicial.validez_dias)
  const [ocupado, setOcupado] = useState(false)
  const { datos: catalogo } = useApi(() => productosApi.listar(), [])

  // El back decide si se puede editar (patrón State): solo "Por Cotizar" y "Borrador"
  const soloLectura = !s.editable
  const limite = s.limite_descuento
  const { lineas, subtotal, descuentos, iva, total } = calcularVistaPrevia(items, s.iva_pct)
  const excedidos = items.filter((i) => i.descuento_pct > limite)

  const cambiar = (clave, campo, valor) => setItems((xs) => xs.map((i) => (i.clave === clave ? { ...i, [campo]: valor } : i)))
  const numero = (clave, campo, max) => (e) => {
    const n = Math.max(0, Number(e.target.value.replace(/\D/g, '')) || 0)
    cambiar(clave, campo, max ? Math.min(n, max) : n)
  }
  const agregar = (e) => {
    const v = e.target.value
    e.target.value = ''
    if (!v) return
    const p = catalogo?.items.find((x) => x.id === Number(v))
    const nuevo = p
      ? { producto_id: p.id, nombre: p.nombre, descripcion: p.descripcion, cantidad: 1, precio_unitario: Math.round(p.precio_usd * s.trm), descuento_pct: 0 }
      : { producto_id: null, nombre: 'Nuevo ítem', descripcion: 'Descripción técnica', cantidad: 1, precio_unitario: 0, descuento_pct: 0 }
    setItems((xs) => [...xs, conClave(nuevo)])
  }

  const datos = () => ({
    items: items.map(({ producto_id, nombre, descripcion, cantidad, precio_unitario, descuento_pct }) =>
      ({ producto_id: producto_id ?? null, nombre, descripcion: descripcion ?? '', cantidad, precio_unitario, descuento_pct })),
    notas,
    validez_dias: validez,
  })

  // Guardar: PUT /api/asesor/solicitudes/:folio  (Por Cotizar -> Borrador)
  const guardar = async () => {
    setOcupado(true)
    try {
      const r = await asesorApi.guardarBorrador(s.folio, datos())
      setS(r)
      setItems(r.items.map(conClave))
      avisar('Borrador guardado')
    } catch (e) {
      avisarError(e)
    } finally {
      setOcupado(false)
    }
  }

  // Enviar: POST .../enviar con los cambios. El back valida el tope de descuento (RN-01) y precios.
  const enviarCliente = async () => {
    setOcupado(true)
    try {
      await asesorApi.enviar(s.folio, datos())
      avisar(`Cotización enviada a ${s.cliente.email}`)
      navigate('/asesor/cotizaciones')
    } catch (e) {
      const detalle = Array.isArray(e.datos?.detalle) ? ` (${e.datos.detalle.join(', ')})` : ''
      avisar(`${e.message.replace(/\.$/, '')}${detalle}`, 'error')
      setOcupado(false)
    }
  }

  const info = [
    ['Empresa / Comprador', [s.cliente.nombre, `NIT: ${s.cliente.nit}`]],
    ['Contacto Corporativo', [s.cliente.contacto, s.cliente.email]],
    ['Ubicación de Despacho', [s.cliente.direccion, s.cliente.ciudad]],
  ]
  const motivoBloqueo = {
    Enviada: 'Esta cotización ya fue enviada al cliente; está esperando su respuesta y no se puede modificar.',
    Aprobada: 'El cliente aprobó esta cotización. Queda solo para consulta.',
    Rechazada: 'Esta cotización fue rechazada. Queda solo para consulta.',
    Vencida: `Esta cotización venció el ${fmtFechaCorta(s.vence)} sin respuesta del cliente.`,
  }[s.estado]

  return (
    <>
      <nav className="mt-6 flex items-center gap-1.5 text-xs text-slate-500 print:hidden">
        <Link to="/asesor/cotizaciones" className="font-semibold hover:text-brand">Cotizaciones</Link>
        <ChevronRight size={12} />
        <span className="font-semibold text-ink">{s.folio}</span>
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

      {soloLectura && motivoBloqueo && (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-600 print:hidden">
          <Lock size={13} className="mt-px shrink-0 text-slate-500" /> {motivoBloqueo}
        </p>
      )}

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
              {[...new Set([...VALIDECES, validez])].sort((a, b) => a - b).map((d) => <option key={d} value={d}>{d} días calendario</option>)}
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
                    {(catalogo?.items || []).filter((p) => p.tipo === t).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
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
                const alerta = l.descuento_pct > limite ? 'text-red-600' : l.descuento_pct >= limite - 5 ? 'text-amber-600' : ''
                return (
                  <tr key={l.clave} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-2"><input value={l.nombre} disabled={soloLectura} onChange={(e) => cambiar(l.clave, 'nombre', e.target.value)} className={`${celda} font-semibold`} /></td>
                    <td className="px-3 py-2"><input value={l.descripcion || ''} disabled={soloLectura} onChange={(e) => cambiar(l.clave, 'descripcion', e.target.value)} className={`${celda} text-slate-500`} /></td>
                    <td className="px-3 py-2"><input inputMode="numeric" value={l.cantidad} disabled={soloLectura} onChange={numero(l.clave, 'cantidad')} className={`${celda} text-right`} /></td>
                    <td className="px-3 py-2"><input inputMode="numeric" value={l.precio_unitario ? Math.round(l.precio_unitario).toLocaleString('es-CO') : ''} placeholder="0" disabled={soloLectura} onChange={numero(l.clave, 'precio_unitario')} className={`${celda} text-right`} /></td>
                    <td className="px-3 py-2 text-right">
                      <input inputMode="numeric" value={l.descuento_pct} disabled={soloLectura} onChange={numero(l.clave, 'descuento_pct', 100)} className={`${celda} text-right font-semibold ${alerta}`} />
                      {alerta && <p className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] font-semibold ${alerta}`}><AlertTriangle size={10} /> {l.descuento_pct > limite ? 'Supera el límite' : 'Alerta'}: Límite {limite}%</p>}
                    </td>
                    <td className="px-3 py-3.5 text-right font-semibold">{fmtCOP(l.subtotal)}</td>
                    <td className="px-3 py-3 print:hidden">
                      {!soloLectura && <button onClick={() => setItems((xs) => xs.filter((i) => i.clave !== l.clave))} className="text-slate-400 hover:text-red-500" aria-label="Quitar ítem"><Trash2 size={14} /></button>}
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
            <div className="flex justify-between text-slate-600"><span>IVA ({s.iva_pct}%)</span><span>{fmtCOP(iva)}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-3 font-display text-base font-semibold"><span>TOTAL NETO</span><span>{fmtCOP(total)}</span></div>
          </div>
          {excedidos.length > 0 && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-600">
              <AlertTriangle size={13} className="mt-px shrink-0" /> {excedidos.length} {excedidos.length === 1 ? 'ítem supera' : 'ítems superan'} el descuento máximo del {limite}%. No se podrá enviar.
            </p>
          )}
          <div className="mt-5 space-y-2 print:hidden">
            {!soloLectura && (
              <button onClick={enviarCliente} disabled={ocupado || !items.length} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                <Send size={14} /> Enviar al Cliente
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              {!soloLectura && (
                <button onClick={guardar} disabled={ocupado} className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 disabled:opacity-60">
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
