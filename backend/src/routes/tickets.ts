import { Router } from 'express'
import { purchaseTicket, getMyTickets, getTicketByRace } from '../controllers/ticketController'
import { authMiddleware,verifyOwnershipOrAdmin } from '../middlewares/auth'

const router = Router()

router.use(authMiddleware)
router.post('/purchase', purchaseTicket)
router.get('/my-tickets', getMyTickets)
router.get('/race/:raceId', verifyOwnershipOrAdmin,getTicketByRace)

export default router