import { Router } from 'express'
import { purchaseTicket, getMyTicket } from '../controllers/ticketController'
import { authMiddleware } from '../middlewares/auth'

const router = Router()
router.use(authMiddleware)
router.post('/purchase', purchaseTicket)
router.get('/my-ticket', getMyTicket)
export default router
