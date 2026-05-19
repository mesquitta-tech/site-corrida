import Badge from '../ui/Badge'

interface Ticket {
  id: string
  category: string
  shirtSize: string
  paymentStatus: 'PAID' | 'PENDING' | 'REFUSED'
  amount: number
  createdAt: string
  user: { name: string; cpf: string; email: string; phone: string; city: string }
  payment?: { qrCode?: string; payload?: string; status: string }
}

interface Props {
  ticket: Ticket
  onShowPix?: () => void
}

export default function TicketCard({ ticket, onShowPix }: Props) {
  return (
    <div className="card space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Ticket #{ticket.id.slice(-6).toUpperCase()}</p>
          <h2 className="text-2xl font-display font-bold text-white">Meu Ticket</h2>
        </div>
        <Badge status={ticket.paymentStatus} />
      </div>

      <div className="grid sm:grid-cols-2 gap-6 pt-2 border-t border-zinc-800">
        <div className="space-y-3">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Dados Pessoais</p>
          <InfoRow label="Nome"     value={ticket.user.name} />
          <InfoRow label="CPF"      value={ticket.user.cpf} />
          <InfoRow label="Email"    value={ticket.user.email} />
          <InfoRow label="Telefone" value={ticket.user.phone} />
          <InfoRow label="Cidade"   value={ticket.user.city} />
        </div>
        <div className="space-y-3">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Detalhes</p>
          <InfoRow label="Categoria" value={`${ticket.category} — R$ ${ticket.amount.toFixed(2)}`} />
          <InfoRow label="Camisa"    value={ticket.shirtSize} />
          <InfoRow label="Comprado em" value={new Date(ticket.createdAt).toLocaleDateString('pt-BR')} />
        </div>
      </div>

      {ticket.paymentStatus === 'PENDING' && onShowPix && ticket.payment && (
        <button onClick={onShowPix} className="btn-ghost w-full text-sm">
          Ver QR Code PIX novamente
        </button>
      )}

      {ticket.paymentStatus === 'PAID' && (
        <div className="bg-emerald-950/40 border border-emerald-900 rounded-xl p-4 text-center">
          <p className="text-emerald-400 font-semibold">🎉 Vaga confirmada! Boa corrida.</p>
          <p className="text-emerald-600 text-sm mt-1">15 de Junho de 2025 — 19h00 · Parque Central, SP</p>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-zinc-600">{label}</span>
      <p className="text-sm text-zinc-200 font-medium">{value}</p>
    </div>
  )
}
