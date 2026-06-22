// frontend/src/pages/AdminPanel.tsx
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import PageWrapper from '../components/layout/PageWrapper'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'
// import { io } from 'socket.io-client'


interface Ticket {
  id: string
  category: string
  shirtSize: string
  paymentStatus: 'PAID' | 'PENDING' | 'REFUSED'
  amount: number
  createdAt: string
  user: { name: string; cpf: string; email: string; phone: string; city: string }
}

interface Race {
  id: string
  name: string
  description: string
  date: string
  location: string
  city: string
  state: string
  maxParticipants: number
  currentParticipants: number
  isActive: boolean
  hasShirts: boolean
  categories: Array<{ id: string; name: string; price: number }>
  createdAt: string
}

interface Stats {
  totalTickets: number
  paidTickets: number
  pendingTickets: number
  totalRevenue: number
}

type TabType = 'tickets' | 'races'

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('tickets')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [races, setRaces] = useState<Race[]>([])
  const [stats, setStats] = useState<Stats>({ totalTickets: 0, paidTickets: 0, pendingTickets: 0, totalRevenue: 0 })
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'PAID'>('all')
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [togglingRace, setTogglingRace] = useState<string | null>(null)
  const navigate = useNavigate()

  

  // Buscar tickets
  const fetchTickets = useCallback(async () => {
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
    } catch (error) {
      console.error('Erro ao buscar tickets:', error)
    } finally {
      setLoading(false)
    }
  }, [search, filter])

  // Buscar corridas
  const fetchRaces = useCallback(async () => {
    try {
      const response = await api.get('/api/races')
      setRaces(response.data)
    } catch (error) {
      console.error('Erro ao buscar corridas:', error)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'tickets') {
      fetchTickets()
    } else {
      fetchRaces()
    }
  }, [activeTab, fetchTickets, fetchRaces])

  const approvePayment = async (id: string) => {
    try {
      await api.patch(`/api/admin/tickets/${id}/approve`)
      setAlert({ type: 'success', msg: 'Pagamento aprovado com sucesso!' })
      setTimeout(() => setAlert(null), 3000)
      fetchTickets()
    } catch {
      setAlert({ type: 'error', msg: 'Erro ao aprovar pagamento' })
      setTimeout(() => setAlert(null), 3000)
    }
  }

  const toggleRaceStatus = async (raceId: string, currentStatus: boolean) => {
    setTogglingRace(raceId)
    try {
      await api.put(`/api/races/${raceId}`, { isActive: !currentStatus })
      setAlert({ 
        type: 'success', 
        msg: `Corrida ${currentStatus ? 'desativada' : 'ativada'} com sucesso!` 
      })
      setTimeout(() => setAlert(null), 3000)
      fetchRaces()
    } catch {
      setAlert({ type: 'error', msg: 'Erro ao alterar status da corrida' })
      setTimeout(() => setAlert(null), 3000)
    } finally {
      setTogglingRace(null)
    }
  }

  const deleteRace = async (raceId: string, hasTickets: boolean) => {
    if (!confirm('Tem certeza que deseja excluir esta corrida?')) return
    
    try {
      await api.delete(`/api/races/${raceId}`)
      setAlert({ 
        type: 'success', 
        msg: hasTickets ? 'Corrida desativada (possui inscrições)' : 'Corrida excluída com sucesso'
      })
      setTimeout(() => setAlert(null), 3000)
      fetchRaces()
    } catch {
      setAlert({ type: 'error', msg: 'Erro ao excluir corrida' })
      setTimeout(() => setAlert(null), 3000)
    }
  }

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <PageWrapper navTitle="👑 Admin" maxWidth="max-w-7xl">
      {/* Header com botão Nova Corrida */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Painel Administrativo</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Gerencie tickets e corridas</p>
        </div>
        <button
          onClick={() => navigate('/admin/criar-corrida')}
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 
                     text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nova Corrida
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="🎫" label="Total Tickets" value={stats.totalTickets} />
        <StatCard icon="✅" label="Pagos" value={stats.paidTickets} accent="text-emerald-400" />
        <StatCard icon="⏳" label="Pendentes" value={stats.pendingTickets} accent="text-amber-400" />
        <StatCard icon="💰" label="Receita" value={`R$ ${stats.totalRevenue.toFixed(2)}`} accent="text-brand-400" />
      </div>

      {alert && (
        <div className="mb-4">
          <Alert type={alert.type}>{alert.msg}</Alert>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-6 py-3 text-sm font-medium transition-all ${
            activeTab === 'tickets'
              ? 'text-brand-400 border-b-2 border-brand-400'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          🎫 Tickets
        </button>
        <button
          onClick={() => setActiveTab('races')}
          className={`px-6 py-3 text-sm font-medium transition-all ${
            activeTab === 'races'
              ? 'text-brand-400 border-b-2 border-brand-400'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          🏁 Corridas
        </button>
      </div>

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="card">
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
              <button onClick={exportCSV} className="btn-ghost px-4 py-2 text-sm">
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
                    {['Nome', 'CPF', 'Email', 'Categoria', 'Camisa', 'Status', 'Valor', 'Ação'].map(h => (
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
                  <div className="text-4xl mb-3">🎫</div>
                  <p>Nenhum ticket encontrado</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Races Tab */}
      {activeTab === 'races' && (
        <div className="space-y-4">
          {/* Corridas Ativas */}
          <div>
            <h2 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
              Corridas Ativas
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {races.filter(r => r.isActive).map(race => (
                <RaceCard
                  key={race.id}
                  race={race}
                  onToggle={() => toggleRaceStatus(race.id, race.isActive)}
                  onDelete={() => deleteRace(race.id, race.currentParticipants > 0)}
                  onEdit={() => navigate(`/admin/editar-corrida/${race.id}`)}
                  toggling={togglingRace === race.id}
                  formatDate={formatDate}
                />
              ))}
              {races.filter(r => r.isActive).length === 0 && (
                <div className="col-span-2 text-center py-8 text-zinc-500">
                  Nenhuma corrida ativa no momento
                </div>
              )}
            </div>
          </div>

          {/* Corridas Inativas/Arquivadas */}
          {races.filter(r => !r.isActive).length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-zinc-500 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-zinc-500 rounded-full"></span>
                Corridas Arquivadas
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 opacity-70">
                {races.filter(r => !r.isActive).map(race => (
                  <RaceCard
                    key={race.id}
                    race={race}
                    onToggle={() => toggleRaceStatus(race.id, race.isActive)}
                    onDelete={() => deleteRace(race.id, race.currentParticipants > 0)}
                    onEdit={() => navigate(`/admin/editar-corrida/${race.id}`)}
                    toggling={togglingRace === race.id}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )}

          {races.length === 0 && !loading && (
            <div className="text-center py-16 text-zinc-600">
              <div className="text-4xl mb-3">🏁</div>
              <p>Nenhuma corrida cadastrada</p>
              <button onClick={() => navigate('/admin/criar-corrida')} className="btn-primary mt-4">
                Criar primeira corrida
              </button>
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  )
}

// Componente RaceCard
function RaceCard({ race, onToggle, onDelete, onEdit, toggling, formatDate }: { 
  race: Race
  onToggle: () => void
  onDelete: () => void
  onEdit: () => void
  toggling: boolean
  formatDate: (date: string) => string
}) {
  const availableSeats = race.maxParticipants - race.currentParticipants
  const occupancyPercent = (race.currentParticipants / race.maxParticipants) * 100

  return (
    <div className={`bg-zinc-900/50 border rounded-xl p-5 transition-all ${
      race.isActive ? 'border-zinc-700 hover:border-brand-500/50' : 'border-zinc-800 opacity-75'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-display font-bold text-white">{race.name}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Criado em: {formatDate(race.createdAt)}</p>
        </div>
        <Badge status={race.isActive ? 'PAID' : 'PENDING'} 
               customText={race.isActive ? 'Ativa' : 'Inativa'} />
      </div>

      <div className="space-y-2 text-sm text-zinc-400 mb-4">
        <p>📅 {formatDate(race.date)}</p>
        <p>📍 {race.location}, {race.city}/{race.state}</p>
        <p>🏃 Categorias: {race.categories.map(c => c.name).join(', ')}</p>
        <p>👕 {race.hasShirts ? 'Com camisa' : 'Sem camisa'}</p>
        <div className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-semibold">{availableSeats}</span>
            <span className="text-xs">vagas disponíveis</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-brand-400 font-semibold">{race.currentParticipants}</span>
            <span className="text-xs">inscritos</span>
          </div>
        </div>
        
        {/* Barra de ocupação */}
        <div className="w-full bg-zinc-800 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full transition-all ${occupancyPercent > 80 ? 'bg-red-500' : 'bg-brand-500'}`}
            style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onEdit} className="flex-1 text-xs py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition">
          ✏️ Editar
        </button>
        <button 
          onClick={onToggle} 
          disabled={toggling}
          className={`flex-1 text-xs py-2 rounded-lg transition ${
            race.isActive 
              ? 'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50' 
              : 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50'
          }`}
        >
          {toggling ? <Spinner size="sm" /> : (race.isActive ? '🔴 Desativar' : '🟢 Ativar')}
        </button>
        <button 
          onClick={onDelete}
          className="text-xs py-2 px-3 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}