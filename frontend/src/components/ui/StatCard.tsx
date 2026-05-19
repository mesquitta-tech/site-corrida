interface StatCardProps {
  label: string
  value: string | number
  accent?: string
  icon?: string
}

export default function StatCard({ label, value, accent = 'text-white', icon }: StatCardProps) {
  return (
    <div className="stat-card">
      {icon && <span className="text-2xl mb-1">{icon}</span>}
      <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest">{label}</p>
      <p className={`text-3xl font-display font-bold ${accent}`}>{value}</p>
    </div>
  )
}
