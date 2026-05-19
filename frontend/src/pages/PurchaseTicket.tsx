import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import PageWrapper from '../components/layout/PageWrapper'
import FormField from '../components/forms/FormField'
import PixPayment from '../components/ticket/PixPayment'
import Alert from '../components/ui/Alert'
import Spinner from '../components/ui/Spinner'

const schema = z.object({
  category:  z.enum(['5km', '10km'], { required_error: 'Selecione a categoria' }),
  shirtSize: z.enum(['PP','P','M','G','GG'], { required_error: 'Selecione o tamanho' })
})
type FormData = z.infer<typeof schema>

const PRICES: Record<string, number> = { '5km': 50, '10km': 80 }

export default function PurchaseTicket() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })
  const [pix, setPix]     = useState<{ qrCode: string; payload: string } | null>(null)
  const [error, setError] = useState('')
  const navigate          = useNavigate()
  const category          = watch('category')
  const price             = category ? PRICES[category] : 0

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      const { data: res } = await api.post('/api/tickets/purchase', data)
      setPix(res.pix)
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { error?: string } } }
      if (e.response?.status === 400) {
        setError(e.response.data?.error ?? 'Erro')
        setTimeout(() => navigate('/dashboard'), 2500)
      } else {
        setError('Erro ao processar compra. Tente novamente.')
      }
    }
  }

  if (pix) {
    return (
      <PageWrapper>
        <div className="card max-w-md mx-auto">
          <PixPayment qrCode={pix.qrCode} payload={pix.payload}
            onGoToDashboard={() => navigate('/dashboard')} />
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="max-w-lg mx-auto space-y-6">
        {/* Info do evento */}
        <div className="card border-brand-900/50 bg-brand-950/20">
          <h3 className="font-display font-bold text-white text-lg mb-3">🏁 Corrida Noturna 2025</h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {[
              { icon: '📅', label: 'Data', value: '15 Jun 2025' },
              { icon: '⏰', label: 'Hora', value: '19h00' },
              { icon: '📍', label: 'Local', value: 'Parque Central, SP' }
            ].map(({ icon, label, value }) => (
              <div key={label} className="text-center p-2 bg-zinc-800/50 rounded-xl">
                <div className="text-xl mb-1">{icon}</div>
                <p className="text-zinc-500 text-xs">{label}</p>
                <p className="text-zinc-200 font-semibold text-xs mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h1 className="text-2xl font-display font-bold text-white mb-6">🎫 Comprar Ticket</h1>

          {error && <Alert type="error">{error}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField label="Categoria" required as="select" error={errors.category?.message}
              {...register('category')}>
              <option value="">Selecione a distância</option>
              <option value="5km">5 km — R$ 50,00</option>
              <option value="10km">10 km — R$ 80,00</option>
            </FormField>

            <FormField label="Tamanho da camisa" required as="select" error={errors.shirtSize?.message}
              {...register('shirtSize')}>
              <option value="">Selecione o tamanho</option>
              {['PP','P','M','G','GG'].map(s => <option key={s} value={s}>{s}</option>)}
            </FormField>

            {/* Resumo do pedido */}
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Total</p>
                <p className="text-2xl font-display font-bold text-white">
                  {price ? `R$ ${price.toFixed(2)}` : '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">Pagamento via</p>
                <p className="text-sm font-semibold text-emerald-400">PIX instantâneo</p>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting || !price}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {isSubmitting ? <><Spinner size="sm" /> Gerando PIX…</> : 'Gerar PIX e Comprar'}
            </button>

            <button type="button" onClick={() => navigate('/dashboard')}
              className="btn-ghost w-full text-sm">
              Cancelar
            </button>
          </form>
        </div>
      </div>
    </PageWrapper>
  )
}
