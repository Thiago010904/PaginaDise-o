const estilos = {
  Aprobada: 'bg-emerald-50 text-emerald-600',
  Pendiente: 'bg-amber-100 text-amber-700',
  Rechazada: 'bg-red-50 text-red-500',
  Vencida: 'bg-slate-200 text-slate-600',
  Borrador: 'bg-slate-100 text-slate-600',
  'Por Cotizar': 'bg-amber-100 text-amber-700',
  Enviada: 'bg-blue-50 text-brand',
}

export default function EstadoBadge({ estado }) {
  return <span className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-semibold ${estilos[estado]}`}>{estado}</span>
}
