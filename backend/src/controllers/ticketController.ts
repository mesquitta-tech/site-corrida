import { Request, Response } from 'express'
import { prisma } from '../prisma'
import { createPixPayment } from '../utils/asaas'

const PRICES: Record<string, number> = { '5km': 50, '10km': 80 }

export const purchaseTicket = async (req: Request, res: Response) => {
  try {
    const { category, shirtSize } = req.body
    const amount = PRICES[category]

    if (!amount) return res.status(400).json({ error: 'Categoria inválida' })

    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })

    const existingTicket = await prisma.ticket.findFirst({ where: { userId: req.userId } })
    if (existingTicket) {
      return res.status(400).json({ error: 'Você já possui um ticket para esta corrida' })
    }

    // Cria ticket e pagamento em transação
    const ticket = await prisma.ticket.create({
      data: { userId: user.id, category, shirtSize, amount, paymentStatus: 'PENDING' }
    })

    const pix = await createPixPayment(
      amount, user.name, user.cpf, user.email, `Ticket Corrida - ${category}`
    )

    await prisma.payment.create({
      data: {
        ticketId: ticket.id,
        transactionId: pix.transactionId,
        qrCode: pix.qrCode,
        payload: pix.payload,
        status: pix.status,
        gateway: 'asaas'
      }
    })

    res.status(201).json({ ticket, pix: { qrCode: pix.qrCode, payload: pix.payload } })
  } catch (error) {
    console.error('Erro na compra do ticket:', error)
    res.status(500).json({ error: 'Erro ao comprar ticket' })
  }
}

export const getMyTicket = async (req: Request, res: Response) => {
  try {
    const ticket = await prisma.ticket.findFirst({
      where: { userId: req.userId },
      include: {
        user: {
          select: { name: true, cpf: true, email: true, phone: true, city: true,
                    birthDate: true, gender: true }
        },
        payment: {
          select: { qrCode: true, payload: true, status: true, paidAt: true }
        }
      }
    })
    if (!ticket) return res.status(404).json({ error: 'Nenhum ticket encontrado' })
    res.json(ticket)
  } catch (error) {
    console.error('Erro ao buscar ticket:', error)
    res.status(500).json({ error: 'Erro interno' })
  }
}
