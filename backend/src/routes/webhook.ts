import { Router } from 'express'
import { prisma } from '../prisma'

const router = Router()

router.post('/asaas', async (req, res) => {
  try {
    // Validação básica de token secreto (configure ASAAS_WEBHOOK_TOKEN no .env e no painel Asaas)
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN
    if (webhookToken) {
      const receivedToken = req.headers['asaas-access-token'] as string | undefined
      if (receivedToken !== webhookToken) {
        console.warn('Webhook com token inválido rejeitado')
        return res.sendStatus(401)
      }
    }

    const { event, payment } = req.body
    console.log('Webhook recebido:', { event, paymentId: payment?.id })

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const dbPayment = await prisma.payment.findFirst({
        where: { transactionId: payment.id }
      })

      if (dbPayment && dbPayment.status !== 'approved') {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: dbPayment.id },
            data: { status: 'approved', paidAt: new Date() }
          }),
          prisma.ticket.update({
            where: { id: dbPayment.ticketId },
            data: { paymentStatus: 'PAID' }
          })
        ])
        console.log(`✅ Pagamento ${payment.id} confirmado → ticket ${dbPayment.ticketId}`)
      }
    }

    res.sendStatus(200)
  } catch (error) {
    console.error('Erro no webhook:', error)
    res.sendStatus(500)
  }
})

export default router
