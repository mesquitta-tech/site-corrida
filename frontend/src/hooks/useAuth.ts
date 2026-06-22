// frontend/src/hooks/useAuth.ts
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

interface User {
  id: string
  name: string
  email: string
  role: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        // Decodificar o token JWT para pegar os dados do usuário
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser({
          id: payload.userId || payload.id,
          name: payload.name || 'Usuário',
          email: payload.email || '',
          role: payload.role || 'ATHLETE'
        })
      } catch (error) {
        console.error('Erro ao decodificar token:', error)
        localStorage.removeItem('token')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    const { token, user } = response.data
    localStorage.setItem('token', token)
    setUser(user)
    return user
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/login')
  }

  return { user, loading, login, logout }
}