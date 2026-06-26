// // frontend/src/hooks/useAuth.ts
// import { useState, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
// import api from '../services/api'

// interface User {
//   id: string
//   name: string
//   email: string
//   role: string
// }

// export function useAuth() {
//   const [user, setUser] = useState<User | null>(null)
//   const [loading, setLoading] = useState(true)
//   const navigate = useNavigate()

//   useEffect(() => {
//     const token = localStorage.getItem('token')
//     if (token) {
//       try {
//         // Decodificar o token JWT para pegar os dados do usuário
//         const payload = JSON.parse(atob(token.split('.')[1]))
//         // No useEffect, antes de setUser
//         console.log('Token decodificado:', payload),
//         console.log('User definido:', { id: payload.userId || payload.id, ... })
//         setUser({
//           id: payload.userId || payload.id,
//           name: payload.name || 'Usuário',
//           email: payload.email || '',
//           role: payload.role || 'ATHLETE'
//         })
//       } catch (error) {
//         console.error('Erro ao decodificar token:', error)
//         localStorage.removeItem('token')
//       }
//     }
//     setLoading(false)
//   }, [])

  

//   const login = async (email: string, password: string) => {
//     const response = await api.post('/auth/login', { email, password })
//     const { token, user } = response.data
//     localStorage.setItem('token', token)
//     setUser(user)
//     return user
//   }

//   const logout = () => {
//     localStorage.removeItem('token')
//     setUser(null)
//     navigate('/login')
//   }

//   return { user, loading, login, logout }
// }
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
    const token = sessionStorage.getItem('token')
    
    if (!token) {
      console.log('🔑 Nenhum token encontrado')
      setLoading(false)
      return
    }

    // 🔥 VALIDA O TOKEN COM O BACKEND
    const validateToken = async () => {
      try {
        console.log('🔍 Validando token com /api/auth/me...')
        const response = await api.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        console.log('✅ Usuário validado:', response.data)
        setUser(response.data)
        sessionStorage.setItem('user',JSON.stringify(response.data))
      } catch (error) {
        console.error('❌ Token inválido ou expirado:', error)
       sessionStorage.removeItem('token')
       sessionStorage.removeItem('user')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    validateToken()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    const { token, user } = response.data
    sessionStorage.setItem('token', token)
    sessionStorage.setItem('token', JSON.stringify(user))
    setUser(user)
    return user
  }

  const logout = () => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }

  return { user, loading, login, logout }
}