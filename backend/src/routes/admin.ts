import { Router } from 'express'
import { authMiddleware, adminMiddleware } from '../middlewares/auth'
import { getAllTickets, approvePayment, getStats, exportTicketsCSV } from '../controllers/adminController'

const router = Router()
router.use(authMiddleware, adminMiddleware)
router.get('/tickets', getAllTickets)
router.get('/stats', getStats)
router.patch('/tickets/:id/approve', approvePayment)
// Export usa token no header via Axios (não window.open)
router.get('/export', exportTicketsCSV)
export default router
