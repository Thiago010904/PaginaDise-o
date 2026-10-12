export default function KpiCard({ icon: Icon, titulo, valor, unidad, nota, notaClass = 'text-slate-500' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">{titulo}</p>
        {Icon && <div className="grid size-8 place-items-center rounded-lg bg-blue-50 text-brand"><Icon size={15} /></div>}
      </div>
      <p className="mt-3 font-display text-2xl font-semibold">
        {valor}{unidad && <span className="ml-1.5 text-sm font-medium text-slate-500">{unidad}</span>}
      </p>
      {nota && <p className={`mt-1 text-[11px] ${notaClass}`}>{nota}</p>}
    </div>
  )
}
