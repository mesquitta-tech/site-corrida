import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Spinner from './components/ui/Spinner'

import Register      from './pages/Register'
import Login         from './pages/Login'
import Dashboard     from './pages/Dashboard'
import PurchaseTicket from './pages/PurchaseTicket'
import AdminPanel    from './pages/AdminPanel'
import CreateRace from './pages/CreateRace'
import EditRace from './pages/EditRace'


function PrivateRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"               element={<Navigate to="/login" replace />} />
      <Route path="/register"       element={<Register />} />
      <Route path="/login"          element={<Login />} />
      <Route path="/dashboard"      element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/purchase-ticket" element={<PrivateRoute><PurchaseTicket /></PrivateRoute>} />
      <Route path="/admin"          element={<PrivateRoute adminOnly><AdminPanel /></PrivateRoute>} />
      <Route path="/admin/criar-corrida" element={<CreateRace />} />
      <Route path="/admin/editar-corrida/:id" element={<PrivateRoute adminOnly><EditRace /></PrivateRoute>} />

    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
