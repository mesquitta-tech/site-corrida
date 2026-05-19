import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import PageWrapper from '../components/layout/PageWrapper'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'

interface Ticket {
  id: string
  category: string
  shirtSize: string
  paymentStatus: 'PAID' | 'PENDING' | 'REFUSED'
  amount: number
  createdAt: string
  user: { name: string; cpf: string; email: string; phone: string; city: string }
}

interface Stats {
  totalTickets: number
  paidTickets: number
  pendingTickets: number
  totalRevenue: number
}

export default function AdminPanel() {
  const [tickets, setTickets]   = useState<Ticket[]>([])
  const [stats, setStats]       = useState<Stats>({ totalTickets: 0, paidTickets: 0, pendingTickets: 0, totalRevenue: 0 })
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState<'all' | 'PENDING' | 'PAID'>('all')
  const [loading, setLoading]   = useState(true)
  const [alert, setAlert]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filter !== 'all') params.set('status', filter)

    try {
      const [ticketsRes, statsRes] = await Promise.all([
        api.get(`/api/admin/tickets?${params}`),
        api.get('/api/admin/stats')
      ])
      setTickets(ticketsRes.data.data)
      setStats(statsRes.data)
    } catch { /* trata erros silenciosamente */ }
    finally { setLoading(false) }
  }, [search, filter])

  useEffect(() => { fetchAll() }, [fetchAll])

  const approvePayment = async (id: string) => {
    try {
      await api.patch(`/api/admin/tickets/${id}/approve`)
      setAlert({ type: 'success', msg: 'Pagamento aprovado com sucesso!' })
      setTimeout(() => setAlert(null), 3000)
      fetchAll()
    } catch {
      setAlert({ type: 'error', msg: 'Erro ao aprovar pagamento' })
      setTimeout(() => setAlert(null), 3000)
    }
  }

  // Export via Axios (mantém o header Authorization)
  const exportCSV = async () => {
    try {
      const { data } = await api.get('/api/admin/export', { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8;' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `tickets_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setAlert({ type: 'error', msg: 'Erro ao exportar CSV' })
      setTimeout(() => setAlert(null), 3000)
    }
  }

  return (
    <PageWrapper navTitle="👑 Admin" maxWidth="max-w-7xl">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="🎫" label="Total" value={stats.totalTickets} />
        <StatCard icon="✅" label="Pagos" value={stats.paidTickets} accent="text-emerald-400" />
        <StatCard icon="⏳" label="Pendentes" value={stats.pendingTickets} accent="text-amber-400" />
        <StatCard icon="💰" label="Receita" value={`R$ ${stats.totalRevenue.toFixed(2)}`} accent="text-brand-400" />
      </div>

      {alert && (
        <div className="mb-4">
          <Alert type={alert.type}>{alert.msg}</Alert>
        </div>
      )}

      <div className="card">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou email…"
            className="input-field flex-1"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="flex gap-2">
            {(['all', 'PENDING', 'PAID'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition
                  ${filter === f
                    ? 'bg-brand-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                {f === 'all' ? 'Todos' : f === 'PENDING' ? 'Pendentes' : 'Pagos'}
              </button>
            ))}
            <button onClick={exportCSV}
              className="btn-ghost px-4 py-2 text-sm whitespace-nowrap">
              ↓ CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Nome','CPF','Email','Categoria','Camisa','Status','Valor','Ação'].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-xs text-zinc-500 font-semibold uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id} className="border-b border-zinc-900 hover:bg-zinc-800/40 transition">
                    <td className="py-3 px-3 text-zinc-200 font-medium">{t.user.name}</td>
                    <td className="py-3 px-3 text-zinc-400 font-mono text-xs">{t.user.cpf}</td>
                    <td className="py-3 px-3 text-zinc-400">{t.user.email}</td>
                    <td className="py-3 px-3 text-zinc-300">{t.category}</td>
                    <td className="py-3 px-3 text-zinc-400">{t.shirtSize}</td>
                    <td className="py-3 px-3"><Badge status={t.paymentStatus} /></td>
                    <td className="py-3 px-3 text-zinc-300">R$ {t.amount.toFixed(2)}</td>
                    <td className="py-3 px-3">
                      {t.paymentStatus === 'PENDING' && (
                        <button onClick={() => approvePayment(t.id)}
                          className="text-xs font-semibold bg-emerald-900/50 hover:bg-emerald-800/60
                                     text-emerald-400 border border-emerald-800 px-3 py-1 rounded-lg transition">
                          Aprovar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tickets.length === 0 && !loading && (
              <div className="text-center py-16 text-zinc-600">
                <div className="text-4xl mb-3">🔍</div>
                <p>Nenhum ticket encontrado</p>
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
