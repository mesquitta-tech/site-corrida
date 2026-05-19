import { Request, Response } from 'express'
import { prisma } from '../prisma'

export const getAllTickets = async (req: Request, res: Response) => {
  try {
    const { search, status, page = '1', limit = '50' } = req.query

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { user: { name:  { contains: search as string, mode: 'insensitive' } } },
        { user: { cpf:   { contains: search as string } } },
        { user: { email: { contains: search as string, mode: 'insensitive' } } }
      ]
    }
    if (status && status !== 'all') where.paymentStatus = status

    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        include: { user: true, payment: true },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      })
    ])

    res.json({
      data: tickets,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string))
    })
  } catch (error) {
    console.error('Erro ao listar tickets:', error)
    res.status(500).json({ error: 'Erro interno' })
  }
}

export const approvePayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await prisma.$transaction([
      prisma.ticket.update({ where: { id }, data: { paymentStatus: 'PAID' } }),
      prisma.payment.updateMany({ where: { ticketId: id },
        data: { status: 'approved', paidAt: new Date() } })
    ])
    res.json({ success: true, message: 'Pagamento aprovado com sucesso' })
  } catch (error) {
    console.error('Erro ao aprovar pagamento:', error)
    res.status(500).json({ error: 'Erro interno' })
  }
}

export const getStats = async (req: Request, res: Response) => {
  try {
    const [totalTickets, paidTickets, revenueData] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { paymentStatus: 'PAID' } }),
      prisma.ticket.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { amount: true } })
    ])
    res.json({
      totalTickets,
      paidTickets,
      pendingTickets: totalTickets - paidTickets,
      totalRevenue: revenueData._sum.amount ?? 0
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    res.status(500).json({ error: 'Erro interno' })
  }
}

// CSV gerado no servidor — o token é passado via query param só para download direto
export const exportTicketsCSV = async (req: Request, res: Response) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: { user: true, payment: true },
      orderBy: { createdAt: 'desc' }
    })

    const rows = [
      ['Nome','CPF','Email','Telefone','Cidade','Categoria','Camisa','Status','Valor','Data Compra','Data Pagamento'],
      ...tickets.map(t => [
        `"${t.user.name}"`, t.user.cpf, t.user.email, t.user.phone, `"${t.user.city}"`,
        t.category, t.shirtSize,
        t.paymentStatus === 'PAID' ? 'PAGO' : 'PENDENTE',
        `R$ ${t.amount.toFixed(2)}`,
        new Date(t.createdAt).toLocaleDateString('pt-BR'),
        t.payment?.paidAt ? new Date(t.payment.paidAt).toLocaleDateString('pt-BR') : '-'
      ])
    ]

    const csv = rows.map(r => r.join(';')).join('\n')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition',
      `attachment; filename="tickets_${new Date().toISOString().split('T')[0]}.csv"`)
    res.send('\uFEFF' + csv)
  } catch (error) {
    console.error('Erro ao exportar CSV:', error)
    res.status(500).json({ error: 'Erro interno' })
  }
}
