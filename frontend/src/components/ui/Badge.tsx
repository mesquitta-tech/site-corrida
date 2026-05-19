type Status = 'PAID' | 'PENDING' | 'REFUSED'

const config: Record<Status, { cls: string; label: string; dot: string }> = {
  PAID:    { cls: 'badge-paid',    label: 'Pago',     dot: 'bg-emerald-400' },
  PENDING: { cls: 'badge-pending', label: 'Pendente', dot: 'bg-amber-400'   },
  REFUSED: { cls: 'bg-red-900/60 text-red-400 border border-red-800 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
             label: 'Recusado',   dot: 'bg-red-400'   }
}

export default function Badge({ status }: { status: Status }) {
  const { cls, label, dot } = config[status]
  return (
    <span className={cls}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
