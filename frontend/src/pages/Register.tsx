import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/layout/AuthLayout'
import FormField from '../components/forms/FormField'
import CpfInput from '../components/forms/CpfInput'
import Alert from '../components/ui/Alert'
import Spinner from '../components/ui/Spinner'

const validateCpf = (cpf: string) => {
  const c = cpf.replace(/\D/g, '')
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false
  const calc = (len: number) => {
    let s = 0
    for (let i = 0; i < len; i++) s += parseInt(c[i]) * (len + 1 - i)
    const r = (s * 10) % 11; return r >= 10 ? 0 : r
  }
  return calc(9) === parseInt(c[9]) && calc(10) === parseInt(c[10])
}

const schema = z.object({
  name:            z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  cpf:             z.string().refine(v => validateCpf(v), { message: 'CPF inválido' }),
  birthDate:       z.string().min(1, 'Data de nascimento obrigatória'),
  gender:          z.string().min(1, 'Selecione o sexo'),
  phone:           z.string().min(10, 'Telefone inválido'),
  email:           z.string().email('Email inválido'),
  city:            z.string().min(2, 'Cidade obrigatória'),
  password:        z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirme a senha')
}).refine(d => d.password === d.confirmPassword, {
  message: 'Senhas não conferem', path: ['confirmPassword']
})

type FormData = z.infer<typeof schema>

export default function Register() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setUser } = useAuth()

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      const { confirmPassword, ...payload } = data
      // Envia CPF sem máscara
      payload.cpf = payload.cpf.replace(/\D/g, '')
      const res = await api.post('/api/auth/register', payload)
      localStorage.setItem('token', res.data.token)
      setUser(res.data.user)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error
      setError(msg || 'Erro ao criar conta')
    }
  }

  return (
    <AuthLayout title="Criar Conta" subtitle="Preencha seus dados para se inscrever">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <Alert type="error">{error}</Alert>}

        <FormField label="Nome completo" required error={errors.name?.message}
          {...register('name')} placeholder="Seu nome" />

        <div className="grid grid-cols-2 gap-3">
          <CpfInput error={errors.cpf?.message} {...register('cpf')} />
          <FormField label="Data de nascimento" required as="input" type="date"
            error={errors.birthDate?.message} {...register('birthDate')} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Sexo" required as="select" error={errors.gender?.message}
            {...register('gender')}>
            <option value="">Selecione</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
            <option value="Outro">Outro</option>
          </FormField>
          <FormField label="Telefone" required error={errors.phone?.message}
            placeholder="(11) 99999-9999" {...register('phone')} />
        </div>

        <FormField label="Email" required type="email" error={errors.email?.message}
          placeholder="seu@email.com" {...register('email')} />

        <FormField label="Cidade" required error={errors.city?.message}
          placeholder="Sua cidade" {...register('city')} />

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Senha" required type="password" error={errors.password?.message}
            placeholder="••••••" {...register('password')} />
          <FormField label="Confirmar senha" required type="password"
            error={errors.confirmPassword?.message}
            placeholder="••••••" {...register('confirmPassword')} />
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
          {isSubmitting ? <><Spinner size="sm" /> Criando conta…</> : 'Criar Conta'}
        </button>

        <p className="text-center text-sm text-zinc-500">
          Já tem conta?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">
            Faça login
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
