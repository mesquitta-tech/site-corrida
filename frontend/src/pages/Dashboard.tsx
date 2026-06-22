// import { useEffect, useState, useCallback } from 'react'
// import { useNavigate } from 'react-router-dom'
// import api from '../services/api'
// import PageWrapper from '../components/layout/PageWrapper'
// import TicketCard from '../components/ticket/TicketCard'
// import PixPayment from '../components/ticket/PixPayment'
// import Spinner from '../components/ui/Spinner'
// import { usePaymentPolling } from '../hooks/usePaymentPolling'

// interface Ticket {
//   id: string
//   category: string
//   shirtSize: string
//   paymentStatus: 'PAID' | 'PENDING' | 'REFUSED'
//   amount: number
//   createdAt: string
//   user: { name: string; cpf: string; email: string; phone: string; city: string }
//   payment?: { qrCode?: string; payload?: string; status: string }
// }

// export default function Dashboard() {
//   const [ticket, setTicket]         = useState<Ticket | null>(null)
//   const [loading, setLoading]       = useState(true)
//   const [showPix, setShowPix]       = useState(false)
//   const navigate = useNavigate()

//   const fetchTicket = useCallback(async () => {
//     try {
//       const { data } = await api.get('/api/tickets/my-ticket')
//       setTicket(data)
//       // Mostra PIX automaticamente se ainda pendente ao carregar
//       if (data.paymentStatus === 'PENDING' && data.payment?.qrCode) setShowPix(true)
//     } catch (err: unknown) {
//       const status = (err as { response?: { status?: number } })?.response?.status
//       if (status === 404) setTicket(null)
//     } finally {
//       setLoading(false)
//     }
//   }, [])

//   useEffect(() => { fetchTicket() }, [fetchTicket])

//   // Polling: atualiza a cada 5s quando ticket está pendente
//   const onPaid = useCallback(() => {
//     setShowPix(false)
//     fetchTicket()
//   }, [fetchTicket])

//   usePaymentPolling(ticket?.paymentStatus === 'PENDING', onPaid)

//   if (loading) {
//     return (
//       <PageWrapper>
//         <div className="flex justify-center py-24"><Spinner size="lg" /></div>
//       </PageWrapper>
//     )
//   }

//   return (
//     <PageWrapper>
//       {!ticket && !loading && (
//         <div className="card text-center py-14 space-y-5">
//           <div className="text-5xl">🎫</div>
//           <h2 className="text-2xl font-display font-bold text-white">
//             Você ainda não tem um ticket
//           </h2>
//           <p className="text-zinc-400 max-w-sm mx-auto text-sm">
//             Garanta sua vaga na corrida. Vagas limitadas!
//           </p>
//           <button onClick={() => navigate('/purchase-ticket')} className="btn-primary px-8 py-3 text-base">
//             Comprar Ticket
//           </button>
//         </div>
//       )}

//       {ticket && showPix && ticket.payment?.qrCode && (
//         <div className="card max-w-md mx-auto">
//           <PixPayment
//             qrCode={ticket.payment.qrCode}
//             payload={ticket.payment.payload ?? ''}
//             onGoToDashboard={() => setShowPix(false)}
//           />
//         </div>
//       )}

//       {ticket && !showPix && (
//         <TicketCard
//           ticket={ticket}
//           onShowPix={ticket.paymentStatus === 'PENDING' ? () => setShowPix(true) : undefined}
//         />
//       )}
//     </PageWrapper>
//   )
// }





// frontend/src/pages/Dashboard.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import PageWrapper from '../components/layout/PageWrapper'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'

interface Ticket {
  id: string
  amount: number
  shirtSize: string
  paymentStatus: 'PAID' | 'PENDING' | 'REFUSED'
  createdAt: string
  race: {
    id: string
    name: string
    date: string
    location: string
    city: string
    state: string
    bannerUrl?: string
  }
  category: {
    id: string
    name: string
    price: number
  }
  payment?: {
    qrCode: string
    payload: string
    status: string
    paidAt?: string
  }
}

export default function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'paid'>('all')
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchMyTickets()
  }, [])

  const fetchMyTickets = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/tickets/my-tickets')
      setTickets(response.data)
    } catch (err) {
      console.error('Erro ao buscar tickets:', err)
      setError('Erro ao carregar seus tickets')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return { text: '✅ PAGO', className: 'bg-emerald-900/50 text-emerald-400 border-emerald-800' }
      case 'PENDING':
        return { text: '⏳ AGUARDANDO PAGAMENTO', className: 'bg-amber-900/50 text-amber-400 border-amber-800' }
      default:
        return { text: '❌ CANCELADO', className: 'bg-red-900/50 text-red-400 border-red-800' }
    }
  }

  // Filtrar tickets baseado na aba ativa
  const filteredTickets = tickets.filter(ticket => {
    if (activeTab === 'pending') return ticket.paymentStatus === 'PENDING'
    if (activeTab === 'paid') return ticket.paymentStatus === 'PAID'
    return true
  })

  const pendingCount = tickets.filter(t => t.paymentStatus === 'PENDING').length
  const paidCount = tickets.filter(t => t.paymentStatus === 'PAID').length

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex justify-center items-center py-16">
          <Spinner size="lg" />
          <span className="ml-3 text-zinc-400">Carregando seus tickets...</span>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Meus Tickets</h1>
            <p className="text-zinc-400 mt-1">
              Olá, <span className="text-brand-400 font-semibold">{user?.name}</span>! 
              Aqui estão todos os seus tickets
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/purchase-ticket')}
              className="btn-primary flex items-center gap-2"
            >
              <span>🎫</span>
              Comprar Ticket
            </button>
            <button
              onClick={logout}
              className="btn-ghost flex items-center gap-2"
            >
              <span>🚪</span>
              Sair
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {/* Tickets */}
        {tickets.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-6xl mb-4">🎫</div>
            <h2 className="text-xl font-bold text-white mb-2">Nenhum ticket encontrado</h2>
            <p className="text-zinc-400 mb-6">
              Você ainda não possui tickets. Adquira um para participar das corridas!
            </p>
            <button
              onClick={() => navigate('/purchase-ticket')}
              className="btn-primary"
            >
              Comprar meu primeiro ticket
            </button>
          </div>
        ) : (
          <>
            {/* Tabs de filtro */}
            <div className="flex gap-2 mb-6 border-b border-zinc-800">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === 'all'
                    ? 'text-brand-400 border-b-2 border-brand-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Todos ({tickets.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === 'pending'
                    ? 'text-amber-400 border-b-2 border-amber-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Pendentes ({pendingCount})
              </button>
              <button
                onClick={() => setActiveTab('paid')}
                className={`px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === 'paid'
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Pagos ({paidCount})
              </button>
            </div>

            {/* Lista de tickets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredTickets.map(ticket => (
                <TicketCard 
                  key={ticket.id} 
                  ticket={ticket} 
                  formatDate={formatDate}
                  formatDateTime={formatDateTime}
                  getStatusBadge={getStatusBadge}
                  onViewDetails={() => setSelectedTicket(ticket)}
                />
              ))}
            </div>

            {filteredTickets.length === 0 && (
              <div className="text-center py-12 text-zinc-500">
                Nenhum ticket encontrado nesta categoria
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de detalhes do ticket */}
      {selectedTicket && (
        <TicketModal 
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onRefresh={fetchMyTickets}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
          getStatusBadge={getStatusBadge}
        />
      )}
    </PageWrapper>
  )
}

// Componente de Card do Ticket
function TicketCard({ 
  ticket, 
  formatDate, 
  formatDateTime,
  getStatusBadge,
  onViewDetails 
}: { 
  ticket: Ticket
  formatDate: (date: string) => string
  formatDateTime: (date: string) => string
  getStatusBadge: (status: string) => { text: string; className: string }
  onViewDetails: () => void
}) {
  const status = getStatusBadge(ticket.paymentStatus)
  const raceDate = new Date(ticket.race.date)
  const isToday = raceDate.toDateString() === new Date().toDateString()
  const isPast = raceDate < new Date()

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all cursor-pointer"
         onClick={onViewDetails}>
      {/* Banner da corrida */}
      {ticket.race.bannerUrl && (
        <div className="h-28 overflow-hidden">
          <img 
            src={ticket.race.bannerUrl} 
            alt={ticket.race.name} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-display font-bold text-white">{ticket.race.name}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              #{ticket.id.slice(0, 8)}
            </p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${status.className}`}>
            {status.text}
          </span>
        </div>

        <div className="space-y-2 text-sm text-zinc-400 mb-4">
          <div className="flex items-center gap-2">
            <span>📅</span>
            <span>{formatDate(ticket.race.date)}</span>
            {isToday && <span className="text-xs text-emerald-400">(HOJE!)</span>}
            {isPast && ticket.paymentStatus === 'PAID' && (
              <span className="text-xs text-zinc-500">(Já realizado)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>📍</span>
            <span>{ticket.race.location}, {ticket.race.city}/{ticket.race.state}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🏃</span>
            <span>{ticket.category.name} - R$ {ticket.amount.toFixed(2)}</span>
          </div>
          {ticket.shirtSize && (
            <div className="flex items-center gap-2">
              <span>👕</span>
              <span>Camisa tamanho {ticket.shirtSize}</span>
            </div>
          )}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onViewDetails() }}
          className="w-full text-center py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-300 transition"
        >
          Ver detalhes
        </button>
      </div>
    </div>
  )
}

// Modal de detalhes do ticket
function TicketModal({ 
  ticket, 
  onClose, 
  onRefresh,
  formatDate, 
  formatDateTime,
  getStatusBadge 
}: { 
  ticket: Ticket
  onClose: () => void
  onRefresh: () => void
  formatDate: (date: string) => string
  formatDateTime: (date: string) => string
  getStatusBadge: (status: string) => { text: string; className: string }
}) {
  const status = getStatusBadge(ticket.paymentStatus)
  const [showPayment, setShowPayment] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const handlePayment = async () => {
    setLoading(true)
    try {
      // Recarregar os tickets para verificar se o pagamento foi confirmado
      await onRefresh()
      setShowPayment(false)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-display font-bold text-white">Detalhes do Ticket</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-white text-2xl">
              ×
            </button>
          </div>

          {/* Status */}
          <div className={`p-4 rounded-xl mb-6 border ${status.className}`}>
            <p className="font-semibold text-center">{status.text}</p>
          </div>

          {/* Informações da corrida */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-white border-b border-zinc-800 pb-2">
              🏁 Informações da Corrida
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-zinc-800/50">
                <span className="text-zinc-500">Evento:</span>
                <span className="text-zinc-200 font-medium">{ticket.race.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/50">
                <span className="text-zinc-500">Data:</span>
                <span className="text-zinc-200">{formatDate(ticket.race.date)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/50">
                <span className="text-zinc-500">Horário:</span>
                <span className="text-zinc-200">
                  {new Date(ticket.race.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/50">
                <span className="text-zinc-500">Local:</span>
                <span className="text-zinc-200">{ticket.race.location}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/50">
                <span className="text-zinc-500">Cidade/UF:</span>
                <span className="text-zinc-200">{ticket.race.city}/{ticket.race.state}</span>
              </div>
            </div>
          </div>

          {/* Informações do ticket */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-white border-b border-zinc-800 pb-2">
              🎫 Dados do Ticket
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-zinc-800/50">
                <span className="text-zinc-500">Categoria:</span>
                <span className="text-zinc-200">{ticket.category.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/50">
                <span className="text-zinc-500">Valor:</span>
                <span className="text-zinc-200 font-semibold text-brand-400">
                  R$ {ticket.amount.toFixed(2)}
                </span>
              </div>
              {ticket.shirtSize && (
                <div className="flex justify-between py-1 border-b border-zinc-800/50">
                  <span className="text-zinc-500">Tamanho da camisa:</span>
                  <span className="text-zinc-200">{ticket.shirtSize}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-zinc-800/50">
                <span className="text-zinc-500">Data da compra:</span>
                <span className="text-zinc-200">{formatDateTime(ticket.createdAt)}</span>
              </div>
              {ticket.payment?.paidAt && (
                <div className="flex justify-between py-1 border-b border-zinc-800/50">
                  <span className="text-zinc-500">Data do pagamento:</span>
                  <span className="text-zinc-200">{formatDateTime(ticket.payment.paidAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* QR Code para pagamento (se pendente) */}
          {ticket.paymentStatus === 'PENDING' && ticket.payment?.qrCode && !showPayment && (
            <button
              onClick={() => setShowPayment(true)}
              className="w-full btn-primary mb-4"
            >
              Ver QR Code para pagamento
            </button>
          )}

          {showPayment && ticket.payment?.qrCode && (
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-white border-b border-zinc-800 pb-2">
                💰 Pagamento PIX
              </h3>
              <div className="text-center">
                <img 
                  src={`data:image/png;base64,${ticket.payment.qrCode}`}
                  alt="QR Code PIX"
                  className="mx-auto w-48 h-48"
                />
                <p className="text-xs text-zinc-500 mt-3">
                  Escaneie o QR Code com seu banco ou use o código copia e cola
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => navigator.clipboard.writeText(ticket.payment?.payload || '')}
                    className="btn-ghost text-sm flex-1"
                  >
                    📋 Copiar código PIX
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="btn-primary text-sm flex-1"
                  >
                    {loading ? 'Verificando...' : '✅ Já paguei'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">
              Fechar
            </button>
            {ticket.paymentStatus === 'PENDING' && (
              <button
                onClick={() => navigate('/purchase-ticket')}
                className="btn-primary flex-1"
              >
                Comprar outro ticket
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}