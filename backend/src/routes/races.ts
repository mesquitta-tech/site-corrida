// backend/src/routes/races.ts
import { Router } from 'express'
import { authMiddleware, adminMiddleware } from '../middlewares/auth'
import {
  createRace,
  getRaces,
  getRaceById,
  updateRace,
  deleteRace,
  getRaceStats,
} from '../controllers/raceController'

const router = Router()

// Rotas públicas (listagem e detalhe)
router.get('/', getRaces)
router.get('/:id', getRaceById)

// Rotas administrativas (protegidas)
router.use(authMiddleware, adminMiddleware)
router.post('/', createRace)
router.put('/:id', updateRace)
router.delete('/:id', deleteRace)
router.get('/:id/stats', getRaceStats)

export default router