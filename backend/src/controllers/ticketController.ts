
import { Request, Response } from 'express'
import { prisma } from '../prisma'
import { createPixPayment } from '../utils/asaas'

export const purchaseTicket = async (req: Request, res: Response) => {
  try {
    const { raceId, categoryId, shirtSize } = req.body
    const userId = req.userId

    // Buscar corrida e categoria
    const race = await prisma.race.findFirst({
      where: { id: raceId, isActive: true },
      include: { categories: true },
    })

    if (!race) {
      return res.status(404).json({ error: 'Corrida não encontrada ou inativa' })
    }

    const category = race.categories.find(c => c.id === categoryId)
    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' })
    }

    // Verificar lotação
    const paidCount = await prisma.ticket.count({
      where: { raceId, paymentStatus: 'PAID' },
    })
    if (paidCount >= race.maxParticipants) {
      return res.status(400).json({ error: 'Corrida lotada!' })
    }

    // Verificar se usuário já tem ticket para essa corrida
    const existing = await prisma.ticket.findFirst({
      where: { userId, raceId },
    })
    if (existing) {
      return res.status(400).json({ error: 'Você já possui um ticket para esta corrida' })
    }

    // Se a corrida tem camisas, validar tamanho
    if (race.hasShirts && !shirtSize) {
      return res.status(400).json({ error: 'Tamanho da camisa é obrigatório' })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })

    const ticket = await prisma.ticket.create({
      data: {
        userId,
        raceId,
        categoryId,
        shirtSize: race.hasShirts ? shirtSize : null,
        amount: category.price,
        paymentStatus: 'PENDING',
      },
    })

    const pix = await createPixPayment(
      category.price,
      user.name,
      user.cpf,
      user.email,
      `Ticket ${race.name} - ${category.name}`
    )

    await prisma.payment.create({
      data: {
        ticketId: ticket.id,
        transactionId: pix.transactionId,
        qrCode: pix.qrCode,
        payload: pix.payload,
        status: pix.status,
        gateway: 'asaas',
      },
    })

    res.status(201).json({ ticket, pix, race, category })
  } catch (error) {
    console.error('Erro na compra do ticket:', error)
    res.status(500).json({ error: 'Erro ao comprar ticket' })
  }
}

export const getMyTickets = async (req: Request, res: Response) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { userId: req.userId },
      include: {
        race: { include: { categories: true } },
        category: true,
        payment: true,
        user: { select: { name: true, cpf: true, email: true, phone: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(tickets)
  } catch (error) {
    console.error('Erro ao buscar tickets:', error)
    res.status(500).json({ error: 'Erro interno' })
  }
}

export const getTicketByRace = async (req: Request, res: Response) => {
  try {
    const { raceId } = req.params
    const ticket = await prisma.ticket.findFirst({
      where: { userId: req.userId, raceId },
      include: { race: true, category: true, payment: true },
    })
    res.json(ticket)
  } catch (error) {
    console.error('Erro ao buscar ticket por corrida:', error)
    res.status(500).json({ error: 'Erro interno' })
  }
}