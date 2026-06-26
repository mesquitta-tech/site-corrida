// backend/src/routes/userRoutes.ts
import { Router } from 'express'
import { adminMiddleware, authMiddleware, verifyOwnershipOrAdmin } from '../middlewares/auth'
import { 
  getCurrentUser,
  getUserById,
  updateUser,
  deleteUser,
  getAllUsers
} from '../controllers/userController'

const router = Router()

// Todas as rotas abaixo exigem autenticação
router.use(authMiddleware)

// 🔹 Rotas do próprio usuário (usam userId do token)
router.get('/me', getCurrentUser)
router.put('/me', updateUser)

// 🔹 Rotas que recebem userId como parâmetro (usam verifyOwnershipOrAdmin)
router.get('/:userId', verifyOwnershipOrAdmin, getUserById)
router.put('/:userId', verifyOwnershipOrAdmin, updateUser)
router.delete('/:userId', verifyOwnershipOrAdmin, deleteUser)

// 🔹 Rota de admin (listar todos os usuários)
router.get('/', adminMiddleware, getAllUsers)

export default router