// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useForm, useFieldArray } from 'react-hook-form'
// import api from '../services/api'
// import PageWrapper from '../components/layout/PageWrapper'
// import Alert from '../components/ui/Alert'
// import Spinner from '../components/ui/Spinner'

// export default function CreateRace() {
//   const navigate = useNavigate()
//   const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
//   const [step, setStep] = useState<1 | 2 | 3>(1)

//   const {
//     register,
//     handleSubmit,
//     control,
//     watch,
//     trigger,
//     formState: { errors, isSubmitting },
//   } = useForm({
//     defaultValues: {
//       name: '',
//       date: '',
//       time: '',
//       location: '',
//       city: '',
//       state: '',
//       maxParticipants: '',
//       description: '',
//       regulationUrl: '',
//       registrationStart: '',
//       registrationEnd: '',
//       hasShirts: true,
//       categories: [{ name: '5km', price: 50 }],
//       shirtSizes: [
//         { size: 'PP', quantity: 0 },
//         { size: 'P',  quantity: 0 },
//         { size: 'M',  quantity: 0 },
//         { size: 'G',  quantity: 0 },
//         { size: 'GG', quantity: 0 },
//         { size: 'XGG',quantity: 0 },
//       ],
//     },
//   })

//   const {
//     fields: catFields,
//     append: appendCat,
//     remove: removeCat,
//   } = useFieldArray({ control, name: 'categories' })

//   const hasShirts = watch('hasShirts')

//   // Validação manual de campos obrigatórios ao trocar de aba (Evita passar com dados vazios)
//   const handleNextStep = async (next: 1 | 2 | 3) => {
//     if (next === 2) {
//       const isValid = await trigger([
//         'name', 'date', 'time', 'location', 
//         'city', 'state', 'maxParticipants', 
//         'registrationStart', 'registrationEnd'
//       ])
//       if (isValid) setStep(2)
//     } else if (next === 3) {
//       const isValid = await trigger('categories')
//       if (isValid) setStep(3)
//     }
//   }

//   const onSubmit = async (data: any) => {
//     try {
//       const payload = {
//         ...data,
//         maxParticipants: Number(data.maxParticipants),
//         date: new Date(`${data.date}T${data.time}:00.000Z`),
//         registrationStart: new Date(`${data.registrationStart}T00:00:00.000Z`),
//         registrationEnd: new Date(`${data.registrationEnd}T23:59:59.000Z`),
//         shirtSizes: data.hasShirts ? data.shirtSizes.map((s: any) => ({ ...s, quantity: Number(s.quantity) })) : [],
//         categories: data.categories.map((c: any) => ({ ...c, price: Number(c.price) }))
//       }
      
//       await api.post('/api/races', payload)
//       setAlert({ type: 'success', msg: 'Corrida criada com sucesso!' })
//       setTimeout(() => navigate('/admin'), 1800)
//     } catch (err: unknown) {
//       const msg =
//         (err as { response?: { data?: { error?: string } } })?.response?.data?.error
//         ?? 'Erro ao criar corrida. Tente novamente.'
//       setAlert({ type: 'error', msg })
//       setTimeout(() => setAlert(null), 4000)
//     }
//   }

  
//   const steps = [
//     { n: 1, label: 'Dados da Corrida' },
//     { n: 2, label: 'Categorias & Preços' },
//     { n: 3, label: 'Camisas & Revisão' },
//   ]

//   return (
//     <PageWrapper navTitle="👑 Admin" maxWidth="max-w-3xl">
      
//       {/* Cabeçalho */}
//       <div className="mb-8">
//         <button
//           type="button"
//           onClick={() => navigate('/admin')}
//           className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition mb-4"
//         >
//           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//             <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
//           </svg>
//           Voltar ao painel
//         </button>

//         <h1 className="text-3xl font-display font-bold text-white">Nova Corrida</h1>
//         <p className="text-sm text-zinc-500 mt-1">Preencha os dados para cadastrar uma nova corrida no sistema</p>
//       </div>

//       {/* Stepper */}
//       <div className="flex items-center gap-0 mb-8">
//         {steps.map((s, i) => (
//           <div key={s.n} className="flex items-center flex-1">
//             <div className="flex flex-col items-center gap-1.5">
//               <div
//                 className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
//                   ${step === s.n
//                     ? 'bg-brand-500 text-white ring-4 ring-brand-500/20'
//                     : step > s.n
//                     ? 'bg-emerald-600 text-white'
//                     : 'bg-zinc-800 text-zinc-500'}`}
//               >
//                 {step > s.n ? '✓' : s.n}
//               </div>
//               <span className={`text-xs font-medium whitespace-nowrap hidden sm:block
//                 ${step === s.n ? 'text-white' : 'text-zinc-600'}`}>
//                 {s.label}
//               </span>
//             </div>
//             {i < steps.length - 1 && (
//               <div className={`flex-1 h-0.5 mx-2 rounded ${step > s.n ? 'bg-emerald-600' : 'bg-zinc-800'}`} />
//             )}
//           </div>
//         ))}
//       </div>

//       {alert && (
//         <div className="mb-6">
//           <Alert type={alert.type}>{alert.msg}</Alert>
//         </div>
//       )}

//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
//         {/* ─── STEP 1: Dados da Corrida ────────────────────────────────────── */}
//         {step === 1 && (
//           <div className="card space-y-5">
//             <SectionTitle icon="🏁" title="Informações da Corrida" />

//             <Field label="Nome da Corrida" required error={(errors.name as any)?.message}>
//               <input {...register('name', { required: 'Nome da corrida obrigatório' })} className="input-field" placeholder="Ex: Corrida Noturna São Paulo 2025" />
//             </Field>

//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//               <Field label="Data do Evento" required error={(errors.date as any)?.message}>
//                 <input {...register('date', { required: 'Data obrigatória' })} type="date" className="input-field" />
//               </Field>
//               <Field label="Horário" required error={(errors.time as any)?.message}>
//                 <input {...register('time', { required: 'Horário obrigatório' })} type="time" className="input-field" />
//               </Field>
//             </div>

//             <Field label="Local / Endereço de Largada" required error={(errors.location as any)?.message}>
//               <input {...register('location', { required: 'Local obrigatório' })} className="input-field" placeholder="Ex: Parque Ibirapuera — Portão 3" />
//             </Field>

//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//               <Field label="Cidade" required error={(errors.city as any)?.message}>
//                 <input {...register('city', { required: 'Cidade obrigatória' })} className="input-field" placeholder="São Paulo" />
//               </Field>
//               <Field label="Estado" required error={(errors.state as any)?.message}>
//                 <select {...register('state', { required: 'Estado obrigatório' })} className="input-field">
//                   <option value="">Selecione…</option>
//                   {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
//                     'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']
//                     .map(uf => <option key={uf} value={uf}>{uf}</option>)}
//                 </select>
//               </Field>
//             </div>

//             <Field label="Capacidade Máxima de Participantes" required error={(errors.maxParticipants as any)?.message}>
//               <input {...register('maxParticipants', { required: 'Capacidade obrigatória' })} type="number" min={1} className="input-field" placeholder="500" />
//             </Field>

//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//               <Field label="Inscrições Abertas em" required error={(errors.registrationStart as any)?.message}>
//                 <input {...register('registrationStart', { required: 'Início das inscrições obrigatório' })} type="date" className="input-field" />
//               </Field>
//               <Field label="Inscrições Encerram em" required error={(errors.registrationEnd as any)?.message}>
//                 <input {...register('registrationEnd', { required: 'Fim das inscrições obrigatório' })} type="date" className="input-field" />
//               </Field>
//             </div>

//             <Field label="Descrição (opcional)">
//               <textarea {...register('description')} rows={3} className="input-field resize-none" placeholder="Descreva o percurso, premiação, diferenciais da corrida…" />
//             </Field>

//             <Field label="Link do Regulamento (opcional)">
//               <input {...register('regulationUrl')} type="url" className="input-field" placeholder="https://…" />
//             </Field>

//             <div className="flex justify-end pt-2">
//               <button type="button" onClick={() => handleNextStep(2)} className="btn-primary px-8">
//                 Próximo →
//               </button>
//             </div>
//           </div>
//         )}

//         {/* ─── STEP 2: Categorias ──────────────────────────────────────────── */}
//         {step === 2 && (
//           <div className="card space-y-5">
//             <SectionTitle icon="🏃" title="Categorias & Preços" />

//             <div className="space-y-3">
//               {catFields.map((field, index) => (
//                 <div key={field.id} className="flex gap-3 items-start bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
//                   <div className="flex-1 grid grid-cols-2 gap-3">
//                     <Field label="Categoria" required error={(errors.categories as any)?.[index]?.name?.message}>
//                       <input {...register(`categories.${index}.name` as const, { required: 'Nome obrigatório' })} className="input-field" placeholder="Ex: 5km, 10km" />
//                     </Field>
//                     <Field label="Preço (R$)" required error={(errors.categories as any)?.[index]?.price?.message}>
//                       <input {...register(`categories.${index}.price` as const, { required: 'Preço obrigatório' })} type="number" step="0.01" min="0" className="input-field" placeholder="50.00" />
//                     </Field>
//                   </div>
//                   {catFields.length > 1 && (
//                     <button
//                       type="button"
//                       onClick={() => removeCat(index)}
//                       className="mt-6 text-zinc-600 hover:text-red-400 transition p-1 rounded-lg hover:bg-red-900/20"
//                     >
//                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                         <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                       </svg>
//                     </button>
//                   )}
//                 </div>
//               ))}
//             </div>

//             <button
//               type="button"
//               onClick={() => appendCat({ name: '', price: 0 })}
//               className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition font-medium"
//             >
//               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
//                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
//               </svg>
//               Adicionar categoria
//             </button>

//             <div className="flex justify-between pt-2">
//               <button type="button" onClick={() => setStep(1)} className="btn-ghost px-8">
//                 ← Voltar
//               </button>
//               <button type="button" onClick={() => handleNextStep(3)} className="btn-primary px-8">
//                 Próximo →
//               </button>
//             </div>
//           </div>
//         )}

//         {/* ─── STEP 3: Camisas & Revisão ───────────────────────────────────── */}
//         {step === 3 && (
//           <div className="space-y-6">
//             <div className="card space-y-5">
//               <SectionTitle icon="👕" title="Camisas" />

//               <label className="flex items-center gap-3 cursor-pointer group">
//                 <div className="relative">
//                   <input {...register('hasShirts')} type="checkbox" className="sr-only peer" />
//                   <div className="w-11 h-6 bg-zinc-700 peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer peer-checked:bg-brand-500 transition-all" />
//                   <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all peer-checked:translate-x-5" />
//                 </div>
//                 <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition">
//                   Esta corrida distribui camisas
//                 </span>
//               </label>

//               {hasShirts && (
//                 <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
//                   <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
//                     {(['PP','P','M','G','GG','XGG'] as const).map((size, idx) => (
//                       <div key={size} className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-3 text-center">
//                         <p className="text-xs font-bold text-zinc-400 uppercase mb-2">{size}</p>
//                         <input
//                           {...register(`shirtSizes.${idx}.quantity` as const)}
//                           type="number" min={0}
//                           className="w-full bg-zinc-900 border border-zinc-700 text-white text-center rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
//                         />
//                         <input {...register(`shirtSizes.${idx}.size` as const)} type="hidden" value={size} />
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Revisão Segura */}
//             <div className="card space-y-4 border-zinc-700">
//               <SectionTitle icon="📋" title="Resumo da Corrida" />
//               <ReviewRow label="Nome" value={watch('name') || '—'} />
//               <ReviewRow label="Data" value={watch('date') ? new Date(watch('date') + 'T12:00:00').toLocaleDateString('pt-BR') : '—'} />
//               <ReviewRow label="Horário" value={watch('time') || '—'} />
//               <ReviewRow label="Local" value={`${watch('location') || '—'}, ${watch('city') || '—'} - ${watch('state') || '—'}`} />
//               <ReviewRow label="Capacidade" value={watch('maxParticipants') ? `${watch('maxParticipants')} participantes` : '—'} />
//               <ReviewRow
//                 label="Categorias"
//                 value={watch('categories')?.filter((c: any) => c && c.name).map((c: any) => `${c.name} — R$ ${Number(c.price || 0).toFixed(2)}`).join(' | ') || '—'}
//               />
//               <ReviewRow label="Camisas" value={hasShirts ? 'Sim' : 'Não'} />
//             </div>

//             <div className="flex justify-between">
//               <button type="button" onClick={() => setStep(2)} className="btn-ghost px-8">
//                 ← Voltar
//               </button>
//               <button
//                 type="submit"
//                 disabled={isSubmitting}
//                 className="btn-primary px-8 flex items-center gap-2"
//               >
//                 {isSubmitting ? <><Spinner size="sm" /> Criando…</> : 'Criar Corrida'}
//               </button>
//             </div>
//           </div>
//         )}
//       </form>
//     </PageWrapper>
//   )
// }

// // ── Helpers de UI ─────────────────────────────────────────────────────────────
// function SectionTitle({ icon, title }: { icon: string; title: string }) {
//   return (
//     <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
//       <span className="text-lg">{icon}</span>
//       <h2 className="text-base font-display font-semibold text-white">{title}</h2>
//     </div>
//   )
// }

// function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
//   return (
//     <div>
//       <label className="text-xs font-medium text-zinc-400 mb-1 block">
//         {label} {required && <span className="text-brand-500">*</span>}
//       </label>
//       {children}
//       {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
//     </div>
//   )
// }

// function ReviewRow({ label, value }: { label: string; value: string }) {
//   return (
//     <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 border-b border-zinc-800/60 last:border-0">
//       <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest sm:w-28 shrink-0 pt-0.5">
//         {label}
//       </span>
//       <span className="text-sm text-zinc-200">{value}</span>
//     </div>
//   )
// }





// src/pages/CreateRace.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import api from '../services/api'
import PageWrapper from '../components/layout/PageWrapper'
import Alert from '../components/ui/Alert'
import Spinner from '../components/ui/Spinner'

export default function CreateRace() {
  const navigate = useNavigate()
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const {
    register,
    handleSubmit,
    control,
    watch,
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
      categories: [{ name: '5km', price: 50 }],
      shirtSizes: [
        { size: 'PP', quantity: 0 },
        { size: 'P',  quantity: 0 },
        { size: 'M',  quantity: 0 },
        { size: 'G',  quantity: 0 },
        { size: 'GG', quantity: 0 },
        { size: 'XGG',quantity: 0 },
      ],
    },
  })

  const {
    fields: catFields,
    append: appendCat,
    remove: removeCat,
  } = useFieldArray({ control, name: 'categories' })

  const hasShirts = watch('hasShirts')

  // Validação manual de campos obrigatórios ao trocar de aba (Evita passar com dados vazios)
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
    // ─── 🔍 ADICIONANDO CONSOLE LOGS PARA DEPURAÇÃO ───────────────────
    console.group("🚀 ANÁLISE DO FORMULÁRIO (FRONT-END)")
    console.log("1. Dados brutos obtidos do formulário:", data)
    console.log(`2. Valor capturado de 'date':`, data.date)
    console.log(`3. Valor capturado de 'time':`, data.time)
    console.groupEnd()
    // ─────────────────────────────────────────────────────────────────

    try {
      const payload = {
        ...data,
        maxParticipants: Number(data.maxParticipants),
        date: data.date && data.time ? `${data.date}T${data.time}:00.000Z` : '', 
        registrationStart: data.registrationStart ? `${data.registrationStart}T00:00:00.000Z` : '',
        registrationEnd: data.registrationEnd ? `${data.registrationEnd}T23:59:59.000Z` : '',
        shirtSizes: data.hasShirts ? data.shirtSizes.map((s: any) => ({ ...s, quantity: Number(s.quantity) })) : [],
        categories: data.categories.map((c: any) => ({ ...c, price: Number(c.price) }))
      }
      
      // ─── 🔍 LOG DO PAYLOAD TRATADO ANTES DO ENVIO AXIOS ──────────────
      console.log("✈️ Enviando Payload estruturado para o Backend:", payload)
      // ─────────────────────────────────────────────────────────────────

      await api.post('/api/races', payload)
      setAlert({ type: 'success', msg: 'Corrida criada com sucesso!' })
      setTimeout(() => navigate('/admin'), 1800)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Erro ao criar corrida. Tente novamente.'
      setAlert({ type: 'error', msg })
      setTimeout(() => setAlert(null), 4000)
    }
  }

  const steps = [
    { n: 1, label: 'Dados da Corrida' },
    { n: 2, label: 'Categorias & Preços' },
    { n: 3, label: 'Camisas & Revisão' },
  ]

  return (
    <PageWrapper navTitle="👑 Admin" maxWidth="max-w-3xl">
      
      {/* Cabeçalho */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Voltar ao painel
        </button>

        <h1 className="text-3xl font-display font-bold text-white">Nova Corrida</h1>
        <p className="text-sm text-zinc-500 mt-1">Preencha os dados para cadastrar uma nova corrida no sistema</p>
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
        
        {/* ─── STEP 1: Dados da Corrida ────────────────────────────────────── */}
        {step === 1 && (
          <div className="card space-y-5">
            <SectionTitle icon="🏁" title="Informações da Corrida" />

            <Field label="Nome da Corrida" required error={(errors.name as any)?.message}>
              <input {...register('name', { required: 'Nome da corrida obrigatório' })} className="input-field" placeholder="Ex: Corrida Noturna São Paulo 2025" />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Data do Evento" required error={(errors.date as any)?.message}>
                <input {...register('date', { required: 'Data obrigatória' })} type="date" className="input-field" />
              </Field>
              <Field label="Horário" required error={(errors.time as any)?.message}>
                <input {...register('time', { required: 'Horário obrigatório' })} type="time" className="input-field" />
              </Field>
            </div>

            <Field label="Local / Endereço de Largada" required error={(errors.location as any)?.message}>
              <input {...register('location', { required: 'Local obrigatório' })} className="input-field" placeholder="Ex: Parque Ibirapuera — Portão 3" />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Cidade" required error={(errors.city as any)?.message}>
                <input {...register('city', { required: 'Cidade obrigatória' })} className="input-field" placeholder="São Paulo" />
              </Field>
              <Field label="Estado" required error={(errors.state as any)?.message}>
                <select {...register('state', { required: 'Estado obrigatório' })} className="input-field">
                  <option value="">Selecione…</option>
                  {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
                    'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']
                    .map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Capacidade Máxima de Participantes" required error={(errors.maxParticipants as any)?.message}>
              <input {...register('maxParticipants', { required: 'Capacidade obrigatória' })} type="number" min={1} className="input-field" placeholder="500" />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Inscrições Abertas em" required error={(errors.registrationStart as any)?.message}>
                <input {...register('registrationStart', { required: 'Início das inscrições obrigatório' })} type="date" className="input-field" />
              </Field>
              <Field label="Inscrições Encerram em" required error={(errors.registrationEnd as any)?.message}>
                <input {...register('registrationEnd', { required: 'Fim das inscrições obrigatório' })} type="date" className="input-field" />
              </Field>
            </div>

            <Field label="Descrição (opcional)">
              <textarea {...register('description')} rows={3} className="input-field resize-none" placeholder="Descreva o percurso, premiação, diferenciais da corrida…" />
            </Field>

            <Field label="Link do Regulamento (opcional)">
              <input {...register('regulationUrl')} type="url" className="input-field" placeholder="https://…" />
            </Field>

            <div className="flex justify-end pt-2">
              <button type="button" onClick={() => handleNextStep(2)} className="btn-primary px-8">
                Próximo →
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Categorias ──────────────────────────────────────────── */}
        {step === 2 && (
          <div className="card space-y-5">
            <SectionTitle icon="🏃" title="Categorias & Preços" />

            <div className="space-y-3">
              {catFields.map((field, index) => (
                <div key={field.id} className="flex gap-3 items-start bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <Field label="Categoria" required error={(errors.categories as any)?.[index]?.name?.message}>
                      <input {...register(`categories.${index}.name` as const, { required: 'Nome obrigatório' })} className="input-field" placeholder="Ex: 5km, 10km" />
                    </Field>
                    <Field label="Preço (R$)" required error={(errors.categories as any)?.[index]?.price?.message}>
                      <input {...register(`categories.${index}.price` as const, { required: 'Preço obrigatório' })} type="number" step="0.01" min="0" className="input-field" placeholder="50.00" />
                    </Field>
                  </div>
                  {catFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCat(index)}
                      className="mt-6 text-zinc-600 hover:text-red-400 transition p-1 rounded-lg hover:bg-red-900/20"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => appendCat({ name: '', price: 0 })}
              className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Adicionar categoria
            </button>

            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setStep(1)} className="btn-ghost px-8">
                ← Voltar
              </button>
              <button type="button" onClick={() => handleNextStep(3)} className="btn-primary px-8">
                Próximo →
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Camisas & Revisão ───────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="card space-y-5">
              <SectionTitle icon="👕" title="Camisas" />

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input {...register('hasShirts')} type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer peer-checked:bg-brand-500 transition-all" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all peer-checked:translate-x-5" />
                </div>
                <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition">
                  Esta corrida distribui camisas
                </span>
              </label>

              {hasShirts && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {(['PP','P','M','G','GG','XGG'] as const).map((size, idx) => (
                      <div key={size} className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-3 text-center">
                        <p className="text-xs font-bold text-zinc-400 uppercase mb-2">{size}</p>
                        <input
                          {...register(`shirtSizes.${idx}.quantity` as const)}
                          type="number" min={0}
                          className="w-full bg-zinc-900 border border-zinc-700 text-white text-center rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                        <input {...register(`shirtSizes.${idx}.size` as const)} type="hidden" value={size} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Revisão Segura */}
            <div className="card space-y-4 border-zinc-700">
              <SectionTitle icon="📋" title="Resumo da Corrida" />
              <ReviewRow label="Nome" value={watch('name') || '—'} />
              <ReviewRow label="Data" value={watch('date') ? new Date(watch('date') + 'T12:00:00').toLocaleDateString('pt-BR') : '—'} />
              <ReviewRow label="Horário" value={watch('time') || '—'} />
              <ReviewRow label="Local" value={`${watch('location') || '—'}, ${watch('city') || '—'} - ${watch('state') || '—'}`} />
              <ReviewRow label="Capacidade" value={watch('maxParticipants') ? `${watch('maxParticipants')} participantes` : '—'} />
              <ReviewRow
                label="Categorias"
                value={watch('categories')?.filter((c: any) => c && c.name).map((c: any) => `${c.name} — R$ ${Number(c.price || 0).toFixed(2)}`).join(' | ') || '—'}
              />
              <ReviewRow label="Camisas" value={hasShirts ? 'Sim' : 'Não'} />
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(2)} className="btn-ghost px-8">
                ← Voltar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary px-8 flex items-center gap-2"
              >
                {isSubmitting ? <><Spinner size="sm" /> Criando…</> : 'Criar Corrida'}
              </button>
            </div>
          </div>
        )}
      </form>
    </PageWrapper>
  )
}

// ── Helpers de UI ─────────────────────────────────────────────────────────────
function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
      <span className="text-lg">{icon}</span>
      <h2 className="text-base font-display font-semibold text-white">{title}</h2>
    </div>
  )
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-zinc-400 mb-1 block">
        {label} {required && <span className="text-brand-500">*</span>}
      </label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 border-b border-zinc-800/60 last:border-0">
      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest sm:w-28 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-zinc-200">{value}</span>
    </div>
  )
}