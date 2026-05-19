import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import PageWrapper from '../components/layout/PageWrapper'
import TicketCard from '../components/ticket/TicketCard'
import PixPayment from '../components/ticket/PixPayment'
import Spinner from '../components/ui/Spinner'
import { usePaymentPolling } from '../hooks/usePaymentPolling'

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

export default function Dashboard() {
  const [ticket, setTicket]         = useState<Ticket | null>(null)
  const [loading, setLoading]       = useState(true)
  const [showPix, setShowPix]       = useState(false)
  const navigate = useNavigate()

  const fetchTicket = useCallback(async () => {
    try {
      const { data } = await api.get('/api/tickets/my-ticket')
      setTicket(data)
      // Mostra PIX automaticamente se ainda pendente ao carregar
      if (data.paymentStatus === 'PENDING' && data.payment?.qrCode) setShowPix(true)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404) setTicket(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTicket() }, [fetchTicket])

  // Polling: atualiza a cada 5s quando ticket está pendente
  const onPaid = useCallback(() => {
    setShowPix(false)
    fetchTicket()
  }, [fetchTicket])

  usePaymentPolling(ticket?.paymentStatus === 'PENDING', onPaid)

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      {!ticket && !loading && (
        <div className="card text-center py-14 space-y-5">
          <div className="text-5xl">🎫</div>
          <h2 className="text-2xl font-display font-bold text-white">
            Você ainda não tem um ticket
          </h2>
          <p className="text-zinc-400 max-w-sm mx-auto text-sm">
            Garanta sua vaga na corrida. Vagas limitadas!
          </p>
          <button onClick={() => navigate('/purchase-ticket')} className="btn-primary px-8 py-3 text-base">
            Comprar Ticket
          </button>
        </div>
      )}

      {ticket && showPix && ticket.payment?.qrCode && (
        <div className="card max-w-md mx-auto">
          <PixPayment
            qrCode={ticket.payment.qrCode}
            payload={ticket.payment.payload ?? ''}
            onGoToDashboard={() => setShowPix(false)}
          />
        </div>
      )}

      {ticket && !showPix && (
        <TicketCard
          ticket={ticket}
          onShowPix={ticket.paymentStatus === 'PENDING' ? () => setShowPix(true) : undefined}
        />
      )}
    </PageWrapper>
  )
}
