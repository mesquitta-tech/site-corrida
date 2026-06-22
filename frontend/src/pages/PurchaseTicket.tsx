// import { useState, useEffect } from 'react'
// import { useForm } from 'react-hook-form'
// import { zodResolver } from '@hookform/resolvers/zod'
// import { z } from 'zod'
// import { useNavigate } from 'react-router-dom'
// import api from '../services/api'
// import PageWrapper from '../components/layout/PageWrapper'
// import PixPayment from '../components/ticket/PixPayment'
// import Alert from '../components/ui/Alert'
// import Spinner from '../components/ui/Spinner'

// const schema = z.object({
//   categoryId: z.string().min(1, 'Selecione a categoria'),
//   shirtSize: z.string().optional()
// })
// type FormData = z.infer<typeof schema>

// interface Race {
//   bannerUrl: any
//   id: string
//   name: string
//   description?: string
//   date: string
//   location: string
//   city: string
//   state: string
//   maxParticipants: number
//   currentParticipants: number
//   isActive: boolean
//   hasShirts: boolean
//   categories: Array<{
//     id: string
//     name: string
//     price: number
//   }>
//   shirtSizes?: Array<{
//     size: string
//     quantity: number
//   }>
// }

// export default function PurchaseTicket() {
//   const [races, setRaces] = useState<Race[]>([])
//   const [selectedRace, setSelectedRace] = useState<Race | null>(null)
//   const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string; price: number } | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [pix, setPix] = useState<{ qrCode: string; payload: string } | null>(null)
//   const [error, setError] = useState('')
//   const navigate = useNavigate()

//   const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>()

//   const selectedCategoryId = watch('categoryId')

//   useEffect(() => {
//     fetchActiveRaces()
//   }, [])

//   useEffect(() => {
//     if (selectedCategoryId && selectedRace) {
//       const category = selectedRace.categories.find(c => c.id === selectedCategoryId)
//       setSelectedCategory(category || null)
//     }
//   }, [selectedCategoryId, selectedRace])

//   const fetchActiveRaces = async () => {
//     try {
//       setLoading(true)
//       const response = await api.get('/api/races?active=true')
//       // Filtrar apenas corridas que ainda têm vagas
//       const availableRaces = response.data.filter((race: Race) => 
//         race.isActive && race.currentParticipants < race.maxParticipants
//       )
//       setRaces(availableRaces)
//     } catch (error) {
//       console.error('Erro ao buscar corridas:', error)
//       setError('Erro ao carregar corridas disponíveis')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const onSubmit = async (data: FormData) => {
//     if (!selectedRace) return
    
//     setError('')
//     try {
//       const payload = {
//         raceId: selectedRace.id,
//         categoryId: data.categoryId,
//         shirtSize: data.shirtSize || null
//       }
      
//       const response = await api.post('/api/tickets/purchase', payload)
//       setPix(response.data.pix)
//     } catch (err: unknown) {
//       const e = err as { response?: { status?: number; data?: { error?: string } } }
//       if (e.response?.status === 400) {
//         setError(e.response.data?.error ?? 'Erro na compra')
//       } else {
//         setError('Erro ao processar compra. Tente novamente.')
//       }
//     }
//   }

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('pt-BR', {
//       day: '2-digit',
//       month: '2-digit',
//       year: 'numeric'
//     })
//   }

//   const formatTime = (dateString: string) => {
//     return new Date(dateString).toLocaleTimeString('pt-BR', {
//       hour: '2-digit',
//       minute: '2-digit'
//     })
//   }

//   // Voltar para a lista de corridas
//   const handleBackToList = () => {
//     setSelectedRace(null)
//     setSelectedCategory(null)
//     setValue('categoryId', '')
//     setValue('shirtSize', '')
//     setError('')
//   }

//   if (pix) {
//     return (
//       <PageWrapper>
//         <div className="card max-w-md mx-auto">
//           <PixPayment 
//             qrCode={pix.qrCode} 
//             payload={pix.payload}
//             onGoToDashboard={() => navigate('/dashboard')} 
//           />
//         </div>
//       </PageWrapper>
//     )
//   }

//   if (loading) {
//     return (
//       <PageWrapper>
//         <div className="flex justify-center items-center py-16">
//           <Spinner size="lg" />
//           <span className="ml-3 text-zinc-400">Carregando corridas disponíveis...</span>
//         </div>
//       </PageWrapper>
//     )
//   }

//   // Tela de seleção de corrida (lista de cards)
//   if (!selectedRace) {
//     if (races.length === 0) {
//       return (
//         <PageWrapper>
//           <div className="card max-w-lg mx-auto text-center py-12">
//             <div className="text-5xl mb-4">🏁</div>
//             <h2 className="text-xl font-bold text-white mb-2">Nenhuma corrida disponível</h2>
//             <p className="text-zinc-400 mb-6">
//               No momento não há corridas ativas com vagas disponíveis.
//             </p>
//             <button onClick={() => navigate('/dashboard')} className="btn-primary">
//               Voltar ao Dashboard
//             </button>
//           </div>
//         </PageWrapper>
//       )
//     }

//     return (
//       <PageWrapper>
//         <div className="max-w-4xl mx-auto">
//           <div className="mb-6">
//             <h1 className="text-3xl font-display font-bold text-white mb-2">🏃 Escolha sua Corrida</h1>
//             <p className="text-zinc-400">Selecione uma das corridas disponíveis para continuar</p>
//           </div>

//           {error && (
//             <div className="mb-4">
//               <Alert type="error">{error}</Alert>
//             </div>
//           )}

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {races.map(race => {
//               const availableSeats = race.maxParticipants - race.currentParticipants
//               const availabilityPercent = (race.currentParticipants / race.maxParticipants) * 100
              
//               return (
//                 <div key={race.id} className="card hover:border-brand-500 transition-all cursor-pointer group"
//                      onClick={() => setSelectedRace(race)}>
//                   {/* Banner (opcional) */}
//                   {race.bannerUrl && (
//                     <div className="h-32 -mt-6 -mx-6 mb-4 rounded-t-xl overflow-hidden">
//                       <img src={race.bannerUrl} alt={race.name} className="w-full h-full object-cover" />
//                     </div>
//                   )}
                  
//                   <div className="flex items-start justify-between mb-3">
//                     <h3 className="text-xl font-display font-bold text-white group-hover:text-brand-400 transition">
//                       {race.name}
//                     </h3>
//                     <div className="bg-brand-500/20 text-brand-400 text-xs font-semibold px-2 py-1 rounded-full">
//                       {race.categories.length} categorias
//                     </div>
//                   </div>

//                   <div className="space-y-2 text-sm text-zinc-400 mb-4">
//                     <p>📅 {formatDate(race.date)} às {formatTime(race.date)}</p>
//                     <p>📍 {race.location}</p>
//                     <p>🏙️ {race.city}/{race.state}</p>
//                     <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800">
//                       <div className="flex items-center gap-1">
//                         <span className="text-emerald-400 font-semibold">{availableSeats}</span>
//                         <span className="text-xs">vagas disponíveis</span>
//                       </div>
//                       <div className="flex items-center gap-1">
//                         <span className="text-brand-400 font-semibold">R$ {Math.min(...race.categories.map(c => c.price)).toFixed(2)}</span>
//                         <span className="text-xs">a partir</span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Barra de progresso de lotação */}
//                   <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-3">
//                     <div 
//                       className="bg-brand-500 h-1.5 rounded-full transition-all"
//                       style={{ width: `${Math.min(availabilityPercent, 100)}%` }}
//                     />
//                   </div>

//                   <button className="w-full btn-primary py-2 text-sm group-hover:bg-brand-600 transition">
//                     Ver detalhes e comprar →
//                   </button>
//                 </div>
//               )
//             })}
//           </div>
//         </div>
//       </PageWrapper>
//     )
//   }

//   // Tela de compra da corrida selecionada
//   const selectedRacePrice = selectedCategory?.price || 0

//   return (
//     <PageWrapper>
//       <div className="max-w-lg mx-auto space-y-6">
//         {/* Botão voltar */}
//         <button 
//           onClick={handleBackToList}
//           className="flex items-center gap-2 text-zinc-400 hover:text-white transition mb-2"
//         >
//           ← Voltar para lista de corridas
//         </button>

//         <div className="card">
//           <h1 className="text-2xl font-display font-bold text-white mb-6">
//             🎫 Comprar Ticket - {selectedRace.name}
//           </h1>

//           {error && <Alert type="error">{error}</Alert>}

//           <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
//             {/* Info da corrida */}
//             <div className="bg-brand-950/20 border border-brand-900/50 rounded-xl p-4">
//               <div className="grid grid-cols-2 gap-3 text-sm">
//                 <div>
//                   <p className="text-zinc-500 text-xs">📅 Data</p>
//                   <p className="text-zinc-200">{formatDate(selectedRace.date)}</p>
//                 </div>
//                 <div>
//                   <p className="text-zinc-500 text-xs">⏰ Horário</p>
//                   <p className="text-zinc-200">{formatTime(selectedRace.date)}</p>
//                 </div>
//                 <div>
//                   <p className="text-zinc-500 text-xs">📍 Local</p>
//                   <p className="text-zinc-200">{selectedRace.location}</p>
//                 </div>
//                 <div>
//                   <p className="text-zinc-500 text-xs">🏙️ Cidade</p>
//                   <p className="text-zinc-200">{selectedRace.city}/{selectedRace.state}</p>
//                 </div>
//               </div>
//             </div>

//             {/* Selecionar Categoria */}
//             <div>
//               <label className="text-xs font-medium text-zinc-400 mb-1 block">
//                 Categoria / Distância <span className="text-brand-500">*</span>
//               </label>
//               <select 
//                 {...register('categoryId', { required: 'Selecione a categoria' })} 
//                 className="input-field"
//               >
//                 <option value="">Selecione a categoria</option>
//                 {selectedRace.categories.map(cat => (
//                   <option key={cat.id} value={cat.id}>
//                     {cat.name} — R$ {cat.price.toFixed(2)}
//                   </option>
//                 ))}
//               </select>
//               {errors.categoryId && <p className="text-red-400 text-xs mt-1">{errors.categoryId.message}</p>}
//             </div>

//             {/* Selecionar Tamanho da Camisa */}
//             {selectedRace.hasShirts && (
//               <div>
//                 <label className="text-xs font-medium text-zinc-400 mb-1 block">
//                   Tamanho da camisa <span className="text-brand-500">*</span>
//                 </label>
//                 <select 
//                   {...register('shirtSize', { required: selectedRace.hasShirts ? 'Selecione o tamanho' : false })} 
//                   className="input-field"
//                 >
//                   <option value="">Selecione o tamanho</option>
//                   {selectedRace.shirtSizes && selectedRace.shirtSizes.filter(s => s.quantity > 0).map(size => (
//                     <option key={size.size} value={size.size}>
//                       {size.size} ({size.quantity} disponíveis)
//                     </option>
//                   ))}
//                 </select>
//                 {errors.shirtSize && <p className="text-red-400 text-xs mt-1">{errors.shirtSize.message}</p>}
//               </div>
//             )}

//             {/* Resumo do pedido */}
//             {selectedCategory && (
//               <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 flex justify-between items-center">
//                 <div>
//                   <p className="text-xs text-zinc-500 uppercase tracking-widest">Total</p>
//                   <p className="text-2xl font-display font-bold text-white">
//                     R$ {selectedRacePrice.toFixed(2)}
//                   </p>
//                 </div>
//                 <div className="text-right">
//                   <p className="text-xs text-zinc-500">Pagamento via</p>
//                   <p className="text-sm font-semibold text-emerald-400">PIX instantâneo</p>
//                 </div>
//               </div>
//             )}

//             <button 
//               type="submit" 
//               disabled={isSubmitting || !selectedCategory}
//               className="btn-primary w-full flex items-center justify-center gap-2 py-3"
//             >
//               {isSubmitting ? <><Spinner size="sm" /> Gerando PIX…</> : 'Gerar PIX e Comprar'}
//             </button>

//             <button type="button" onClick={handleBackToList} className="btn-ghost w-full text-sm">
//               Cancelar e voltar
//             </button>
//           </form>
//         </div>
//       </div>
//     </PageWrapper>
//   )
// }





import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import PageWrapper from '../components/layout/PageWrapper'
import PixPayment from '../components/ticket/PixPayment'
import Alert from '../components/ui/Alert'
import Spinner from '../components/ui/Spinner'

const schema = z.object({
  categoryId: z.string().min(1, 'Selecione a categoria'),
  shirtSize: z.string().optional()
})
type FormData = z.infer<typeof schema>

interface Race {
  bannerUrl: any
  id: string
  name: string
  description?: string
  date: string
  location: string
  city: string
  state: string
  maxParticipants: number
  currentParticipants: number
  isActive: boolean
  hasShirts: boolean
  categories: Array<{
    id: string
    name: string
    price: number
  }>
  shirtSizes?: Array<{
    size: string
    quantity: number
  }>
}

export default function PurchaseTicket() {
  const [races, setRaces] = useState<Race[]>([])
  const [selectedRace, setSelectedRace] = useState<Race | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string; price: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [pix, setPix] = useState<{ qrCode: string; payload: string } | null>(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>()

  const selectedCategoryId = watch('categoryId')

  useEffect(() => {
    fetchActiveRaces()
  }, [])

  useEffect(() => {
    if (selectedCategoryId && selectedRace) {
      const category = selectedRace.categories.find(c => c.id === selectedCategoryId)
      setSelectedCategory(category || null)
    }
  }, [selectedCategoryId, selectedRace])

  const fetchActiveRaces = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/races?active=true')
      const availableRaces = response.data.filter((race: Race) => 
        race.isActive && race.currentParticipants < race.maxParticipants
      )
      setRaces(availableRaces)
    } catch (error) {
      console.error('Erro ao buscar corridas:', error)
      setError('Erro ao carregar corridas disponíveis')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!selectedRace) return
    
    setError('')
    try {
      const payload = {
        raceId: selectedRace.id,
        categoryId: data.categoryId,
        shirtSize: data.shirtSize || null
      }
      
      const response = await api.post('/api/tickets/purchase', payload)
      setPix(response.data.pix)
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { error?: string } } }
      if (e.response?.status === 400) {
        setError(e.response.data?.error ?? 'Erro na compra')
      } else {
        setError('Erro ao processar compra. Tente novamente.')
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleBackToList = () => {
    setSelectedRace(null)
    setSelectedCategory(null)
    setValue('categoryId', '')
    setValue('shirtSize', '')
    setError('')
  }

  if (pix) {
    return (
      <PageWrapper>
        <div className="card max-w-md mx-auto">
          <PixPayment 
            qrCode={pix.qrCode} 
            payload={pix.payload}
            onGoToDashboard={() => navigate('/dashboard')} 
          />
        </div>
      </PageWrapper>
    )
  }

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex justify-center items-center py-16">
          <Spinner size="lg" />
          <span className="ml-3 text-zinc-400">Carregando corridas disponíveis...</span>
        </div>
      </PageWrapper>
    )
  }

  // Tela de seleção de corrida (lista de cards)
  if (!selectedRace) {
    if (races.length === 0) {
      return (
        <PageWrapper>
          <div className="card max-w-lg mx-auto text-center py-12">
            <div className="text-5xl mb-4">🏁</div>
            <h2 className="text-xl font-bold text-white mb-2">Nenhuma corrida disponível</h2>
            <p className="text-zinc-400 mb-6">
              No momento não há corridas ativas com vagas disponíveis.
            </p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              Ver meus tickets
            </button>
          </div>
        </PageWrapper>
      )
    }

    return (
      <PageWrapper>
        {/* Header com botão Meus Tickets */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">🏃 Escolha sua Corrida</h1>
            <p className="text-zinc-400">Selecione uma das corridas disponíveis para continuar</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl transition-all duration-200"
          >
            <span>🎫</span>
            Meus Tickets
          </button>
        </div>

        {error && (
          <div className="mb-4">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {races.map(race => {
            const availableSeats = race.maxParticipants - race.currentParticipants
            const availabilityPercent = (race.currentParticipants / race.maxParticipants) * 100
            
            return (
              <div key={race.id} className="card hover:border-brand-500 transition-all cursor-pointer group"
                   onClick={() => setSelectedRace(race)}>
                {race.bannerUrl && (
                  <div className="h-32 -mt-6 -mx-6 mb-4 rounded-t-xl overflow-hidden">
                    <img src={race.bannerUrl} alt={race.name} className="w-full h-full object-cover" />
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-display font-bold text-white group-hover:text-brand-400 transition">
                    {race.name}
                  </h3>
                  <div className="bg-brand-500/20 text-brand-400 text-xs font-semibold px-2 py-1 rounded-full">
                    {race.categories.length} categorias
                  </div>
                </div>

                <div className="space-y-2 text-sm text-zinc-400 mb-4">
                  <p>📅 {formatDate(race.date)} às {formatTime(race.date)}</p>
                  <p>📍 {race.location}</p>
                  <p>🏙️ {race.city}/{race.state}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800">
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-400 font-semibold">{availableSeats}</span>
                      <span className="text-xs">vagas disponíveis</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-brand-400 font-semibold">R$ {Math.min(...race.categories.map(c => c.price)).toFixed(2)}</span>
                      <span className="text-xs">a partir</span>
                    </div>
                  </div>
                </div>

                <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-3">
                  <div 
                    className="bg-brand-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(availabilityPercent, 100)}%` }}
                  />
                </div>

                <button className="w-full btn-primary py-2 text-sm group-hover:bg-brand-600 transition">
                  Ver detalhes e comprar →
                </button>
              </div>
            )
          })}
        </div>
      </PageWrapper>
    )
  }

  // Tela de compra da corrida selecionada
  const selectedRacePrice = selectedCategory?.price || 0

  return (
    <PageWrapper>
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header com botão Meus Tickets */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button 
            onClick={handleBackToList}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition"
          >
            ← Voltar para lista de corridas
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl transition-all duration-200 text-sm"
          >
            <span>🎫</span>
            Meus Tickets
          </button>
        </div>

        <div className="card">
          <h1 className="text-2xl font-display font-bold text-white mb-6">
            🎫 Comprar Ticket - {selectedRace.name}
          </h1>

          {error && <Alert type="error">{error}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="bg-brand-950/20 border border-brand-900/50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-zinc-500 text-xs">📅 Data</p>
                  <p className="text-zinc-200">{formatDate(selectedRace.date)}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">⏰ Horário</p>
                  <p className="text-zinc-200">{formatTime(selectedRace.date)}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">📍 Local</p>
                  <p className="text-zinc-200">{selectedRace.location}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">🏙️ Cidade</p>
                  <p className="text-zinc-200">{selectedRace.city}/{selectedRace.state}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1 block">
                Categoria / Distância <span className="text-brand-500">*</span>
              </label>
              <select 
                {...register('categoryId', { required: 'Selecione a categoria' })} 
                className="input-field"
              >
                <option value="">Selecione a categoria</option>
                {selectedRace.categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} — R$ {cat.price.toFixed(2)}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="text-red-400 text-xs mt-1">{errors.categoryId.message}</p>}
            </div>

            {selectedRace.hasShirts && (
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">
                  Tamanho da camisa <span className="text-brand-500">*</span>
                </label>
                <select 
                  {...register('shirtSize', { required: selectedRace.hasShirts ? 'Selecione o tamanho' : false })} 
                  className="input-field"
                >
                  <option value="">Selecione o tamanho</option>
                  {selectedRace.shirtSizes && selectedRace.shirtSizes.filter(s => s.quantity > 0).map(size => (
                    <option key={size.size} value={size.size}>
                      {size.size} ({size.quantity} disponíveis)
                    </option>
                  ))}
                </select>
                {errors.shirtSize && <p className="text-red-400 text-xs mt-1">{errors.shirtSize.message}</p>}
              </div>
            )}

            {selectedCategory && (
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest">Total</p>
                  <p className="text-2xl font-display font-bold text-white">
                    R$ {selectedRacePrice.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500">Pagamento via</p>
                  <p className="text-sm font-semibold text-emerald-400">PIX instantâneo</p>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting || !selectedCategory}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {isSubmitting ? <><Spinner size="sm" /> Gerando PIX…</> : 'Gerar PIX e Comprar'}
            </button>

            <button type="button" onClick={handleBackToList} className="btn-ghost w-full text-sm">
              Cancelar e voltar
            </button>
          </form>
        </div>
      </div>
    </PageWrapper>
  )
}


