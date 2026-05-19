import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import AuthLayout from '../components/layout/AuthLayout'
import FormField from '../components/forms/FormField'
import Alert from '../components/ui/Alert'
import Spinner from '../components/ui/Spinner'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard')
    } catch {
      setError('Email ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Bem-vindo" subtitle="Entre na sua conta para continuar">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error">{error}</Alert>}

        <FormField label="Email" type="email" required
          value={email} onChange={e => setEmail(e.target.value)}
          placeholder="seu@email.com" />

        <FormField label="Senha" type="password" required
          value={password} onChange={e => setPassword(e.target.value)}
          placeholder="••••••" />

        <button type="submit" disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <><Spinner size="sm" /> Entrando…</> : 'Entrar'}
        </button>

        <p className="text-center text-sm text-zinc-500">
          Não tem conta?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">
            Registre-se
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
