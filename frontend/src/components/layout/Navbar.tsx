import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface NavbarProps {
  title?: string
}

export default function Navbar({ title = '🏃 Corrida Noturna' }: NavbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <nav className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <span className="font-display font-bold text-white tracking-tight">{title}</span>

        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden sm:block text-sm text-zinc-400">
              {user.name.split(' ')[0]}
            </span>
          )}
          {user?.role === 'ADMIN' && (
            <button onClick={() => navigate('/admin')}
              className="text-xs font-semibold bg-purple-900/50 hover:bg-purple-800/60
                         text-purple-300 border border-purple-800 px-3 py-1 rounded-lg transition">
              Admin
            </button>
          )}
          {user && (
            <button onClick={logout}
              className="text-xs text-zinc-500 hover:text-red-400 transition font-medium">
              Sair
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
