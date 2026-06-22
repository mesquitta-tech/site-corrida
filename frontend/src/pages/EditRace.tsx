// frontend/src/pages/EditRace.tsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import api from '../services/api'
import PageWrapper from '../components/layout/PageWrapper'
import Alert from '../components/ui/Alert'
import Spinner from '../components/ui/Spinner'

interface RaceCategory {
  id: string
  name: string
  price: number
}

interface ShirtSize {
  size: string
  quantity: number
}

interface RaceData {
  id: string
  name: string
  description: string
  date: string
  location: string
  city: string
  state: string
  maxParticipants: number
  regulationUrl: string
  registrationStart: string
  registrationEnd: string
  hasShirts: boolean
  isActive: boolean
  categories: RaceCategory[]
  shirtSizes: ShirtSize[]
}

export default function EditRace() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      date: '',
      time: '',
      location: '',
      city: '',
      state: '',
      maxParticipants: '',
      description: '',
      regulationUrl: '',
      registrationStart: '',
      registrationEnd: '',
      hasShirts: true,
      isActive: true,
      categories: [{ name: '', price: 0 }],
      shirtSizes: [
        { size: 'PP', quantity: 0 },
        { size: 'P', quantity: 0 },
        { size: 'M', quantity: 0 },
        { size: 'G', quantity: 0 },
        { size: 'GG', quantity: 0 },
        { size: 'XGG', quantity: 0 },
      ],
    },
  })

  const {
    fields: catFields,
    append: appendCat,
    remove: removeCat,
  } = useFieldArray({ control, name: 'categories' })

  const hasShirts = watch('hasShirts')

  // Buscar dados da corrida
  useEffect(() => {
    const fetchRace = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/api/races/${id}`)
        const race = response.data
        
        // Formatar data para o input datetime-local
        const raceDate = new Date(race.date)
        const formattedDate = raceDate.toISOString().split('T')[0]
        const formattedTime = raceDate.toTimeString().slice(0, 5)
        
        const startDate = new Date(race.registrationStart).toISOString().split('T')[0]
        const endDate = new Date(race.registrationEnd).toISOString().split('T')[0]
        
        setValue('name', race.name)
        setValue('description', race.description || '')
        setValue('date', formattedDate)
        setValue('time', formattedTime)
        setValue('location', race.location)
        setValue('city', race.city)
        setValue('state', race.state)
        setValue('maxParticipants', race.maxParticipants.toString())
        setValue('regulationUrl', race.regulationUrl || '')
        setValue('registrationStart', startDate)
        setValue('registrationEnd', endDate)
        setValue('hasShirts', race.hasShirts)
        setValue('isActive', race.isActive)
        
        if (race.categories && race.categories.length > 0) {
          setValue('categories', race.categories.map((c: RaceCategory) => ({
            name: c.name,
            price: c.price
          })))
        }
        
        if (race.shirtSizes && race.shirtSizes.length > 0 && race.hasShirts) {
          const sizes = ['PP', 'P', 'M', 'G', 'GG', 'XGG']
          sizes.forEach((size, idx) => {
            const found = race.shirtSizes.find((s: ShirtSize) => s.size === size)
            setValue(`shirtSizes.${idx}.quantity`, found?.quantity || 0)
          })
        }
      } catch (error) {
        console.error('Erro ao buscar corrida:', error)
        setAlert({ type: 'error', msg: 'Erro ao carregar dados da corrida' })
      } finally {
        setLoading(false)
      }
    }
    
    if (id) fetchRace()
  }, [id, setValue])

  const handleNextStep = async (next: 1 | 2 | 3) => {
    if (next === 2) {
      const isValid = await trigger([
        'name', 'date', 'time', 'location', 
        'city', 'state', 'maxParticipants', 
        'registrationStart', 'registrationEnd'
      ])
      if (isValid) setStep(2)
    } else if (next === 3) {
      const isValid = await trigger('categories')
      if (isValid) setStep(3)
    }
  }

  const onSubmit = async (data: any) => {
    try {
      const raceDateTime = new Date(`${data.date}T${data.time}:00`)
      
      const payload = {
        name: data.name,
        description: data.description,
        date: raceDateTime.toISOString(),
        location: data.location,
        city: data.city,
        state: data.state,
        maxParticipants: Number(data.maxParticipants),
        regulationUrl: data.regulationUrl,
        registrationStart: new Date(`${data.registrationStart}T00:00:00`).toISOString(),
        registrationEnd: new Date(`${data.registrationEnd}T23:59:59`).toISOString(),
        hasShirts: data.hasShirts,
        isActive: data.isActive,
        categories: data.categories.map((c: any) => ({
          name: c.name,
          price: Number(c.price)
        })),
        shirtSizes: data.hasShirts ? data.shirtSizes.map((s: any) => ({
          size: s.size,
          quantity: Number(s.quantity)
        })) : []
      }
      
      await api.put(`/api/races/${id}`, payload)
      setAlert({ type: 'success', msg: 'Corrida atualizada com sucesso!' })
      setTimeout(() => navigate('/admin'), 1800)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Erro ao atualizar corrida. Tente novamente.'
      setAlert({ type: 'error', msg })
      setTimeout(() => setAlert(null), 4000)
    }
  }

  const steps = [
    { n: 1, label: 'Dados da Corrida' },
    { n: 2, label: 'Categorias & Preços' },
    { n: 3, label: 'Camisas & Revisão' },
  ]

  if (loading) {
    return (
      <PageWrapper navTitle="👑 Admin" maxWidth="max-w-3xl">
        <div className="flex justify-center items-center py-16">
          <Spinner size="lg" />
          <span className="ml-3 text-zinc-400">Carregando dados da corrida...</span>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper navTitle="👑 Admin" maxWidth="max-w-3xl">
      <div className="mb-8">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition mb-4"
        >
          ← Voltar ao painel
        </button>
        <h1 className="text-3xl font-display font-bold text-white">Editar Corrida</h1>
        <p className="text-sm text-zinc-500 mt-1">Altere os dados da corrida</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0 mb-8">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${step === s.n
                    ? 'bg-brand-500 text-white ring-4 ring-brand-500/20'
                    : step > s.n
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-500'}`}
              >
                {step > s.n ? '✓' : s.n}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap hidden sm:block
                ${step === s.n ? 'text-white' : 'text-zinc-600'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 rounded ${step > s.n ? 'bg-emerald-600' : 'bg-zinc-800'}`} />
            )}
          </div>
        ))}
      </div>

      {alert && (
        <div className="mb-6">
          <Alert type={alert.type}>{alert.msg}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* STEP 1 - igual ao CreateRace */}
        {step === 1 && (
          <div className="card space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <h2 className="text-base font-display font-semibold text-white">📋 Informações da Corrida</h2>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register('isActive')} className="w-4 h-4" />
                <span className="text-zinc-400">Corrida ativa</span>
              </label>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1 block">
                Nome da Corrida <span className="text-brand-500">*</span>
              </label>
              <input {...register('name', { required: 'Nome obrigatório' })} className="input-field" />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message as string}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">Data <span className="text-brand-500">*</span></label>
                <input {...register('date', { required: 'Data obrigatória' })} type="date" className="input-field" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">Horário <span className="text-brand-500">*</span></label>
                <input {...register('time', { required: 'Horário obrigatório' })} type="time" className="input-field" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1 block">Local <span className="text-brand-500">*</span></label>
              <input {...register('location', { required: 'Local obrigatório' })} className="input-field" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">Cidade <span className="text-brand-500">*</span></label>
                <input {...register('city', { required: 'Cidade obrigatória' })} className="input-field" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">Estado <span className="text-brand-500">*</span></label>
                <select {...register('state', { required: 'Estado obrigatório' })} className="input-field">
                  <option value="">Selecione</option>
                  {['SP','RJ','MG','ES','BA','PR','SC','RS','DF','GO','MT','MS','AM','PA','PE','CE','RN','PB','MA','PI','AL','SE','RO','AC','RR','TO','AP'].map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1 block">Capacidade Máxima <span className="text-brand-500">*</span></label>
              <input {...register('maxParticipants', { required: 'Capacidade obrigatória', valueAsNumber: true })} type="number" className="input-field" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">Início Inscrições <span className="text-brand-500">*</span></label>
                <input {...register('registrationStart', { required: 'Obrigatório' })} type="date" className="input-field" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">Fim Inscrições <span className="text-brand-500">*</span></label>
                <input {...register('registrationEnd', { required: 'Obrigatório' })} type="date" className="input-field" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1 block">Descrição</label>
              <textarea {...register('description')} rows={3} className="input-field resize-none" />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1 block">Regulamento (URL)</label>
              <input {...register('regulationUrl')} type="url" className="input-field" placeholder="https://..." />
            </div>

            <div className="flex justify-end pt-2">
              <button type="button" onClick={() => handleNextStep(2)} className="btn-primary px-8">
                Próximo →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 - Categorias (igual ao CreateRace) */}
        {step === 2 && (
          <div className="card space-y-5">
            <h2 className="text-base font-display font-semibold text-white pb-2 border-b border-zinc-800">🏃 Categorias & Preços</h2>

            {catFields.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-start bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-400 mb-1 block">Categoria</label>
                    <input {...register(`categories.${index}.name` as const)} className="input-field" placeholder="Ex: 5km" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400 mb-1 block">Preço (R$)</label>
                    <input {...register(`categories.${index}.price` as const)} type="number" step="0.01" className="input-field" />
                  </div>
                </div>
                {catFields.length > 1 && (
                  <button type="button" onClick={() => removeCat(index)} className="mt-6 text-red-400 hover:text-red-300">
                    ✕
                  </button>
                )}
              </div>
            ))}

            <button type="button" onClick={() => appendCat({ name: '', price: 0 })} className="text-sm text-brand-400 hover:text-brand-300">
              + Adicionar categoria
            </button>

            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setStep(1)} className="btn-ghost px-8">← Voltar</button>
              <button type="button" onClick={() => handleNextStep(3)} className="btn-primary px-8">Próximo →</button>
            </div>
          </div>
        )}

        {/* STEP 3 - Camisas e Submit */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="card space-y-5">
              <h2 className="text-base font-display font-semibold text-white pb-2 border-b border-zinc-800">👕 Camisas</h2>

              <label className="flex items-center gap-3 cursor-pointer">
                <input {...register('hasShirts')} type="checkbox" className="w-4 h-4" />
                <span className="text-sm text-zinc-300">Esta corrida distribui camisas</span>
              </label>

              {hasShirts && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {['PP','P','M','G','GG','XGG'].map((size, idx) => (
                    <div key={size} className="bg-zinc-800/60 rounded-xl p-3 text-center">
                      <p className="text-xs font-bold text-zinc-400 uppercase mb-2">{size}</p>
                      <input {...register(`shirtSizes.${idx}.quantity` as const)} type="number" min={0} className="w-full bg-zinc-900 rounded-lg px-2 py-1.5 text-center text-sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(2)} className="btn-ghost px-8">← Voltar</button>
              <button type="submit" disabled={isSubmitting} className="btn-primary px-8">
                {isSubmitting ? <Spinner size="sm" /> : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        )}
      </form>
    </PageWrapper>
  )
}