// import { Request, Response } from 'express'

// import { PrismaClient } from '@prisma/client'

// const prisma = new PrismaClient()

// export const getAllTickets = async (req: Request, res: Response) => {
//   try {
//     const { search, status, page = '1', limit = '50' } = req.query

//     const where: Record<string, unknown> = {}
//     if (search) {
//       where.OR = [
//         { user: { name:  { contains: search as string, mode: 'insensitive' } } },
//         { user: { cpf:   { contains: search as string } } },
//         { user: { email: { contains: search as string, mode: 'insensitive' } } }
//       ]
//     }
//     if (status && status !== 'all') where.paymentStatus = status

//     // Buscar tickets incluindo a categoria e a corrida
//     const [total, tickets] = await Promise.all([
//       prisma.ticket.count({ where }),
//       prisma.ticket.findMany({
//         where,
//         include: { 
//           user: true, 
//           payment: true,
//           category: true,   // ← inclui a relação
//           race: true        // ← opcional, mas útil
//         },
//         orderBy: { createdAt: 'desc' },
//         skip: (parseInt(page as string) - 1) * parseInt(limit as string),
//         take: parseInt(limit as string)
//       })
//     ])

//     // Mapear para adicionar um campo `category` como string (nome da categoria)
//     // e também adicionar `raceName` se quiser exibir no frontend futuramente
//     const formattedTickets = tickets.map((ticket:any) => ({
//       id: ticket.id,
//       amount: ticket.amount,
//       shirtSize: ticket.shirtSize,
//       paymentStatus: ticket.paymentStatus,
//       createdAt: ticket.createdAt,
//       updatedAt: ticket.updatedAt,
//       userId: ticket.userId,
//       raceId: ticket.raceId,
//       categoryId: ticket.categoryId,
//       // campos que o frontend espera:
//       category: ticket.category.name,           // ← string com nome da categoria
//       raceName: ticket.race.name,               // ← se quiser exibir no frontend
//       user: ticket.user,
//       payment: ticket.payment
//     }))

//     res.json({
//       data: formattedTickets,
//       total,
//       page: parseInt(page as string),
//       totalPages: Math.ceil(total / parseInt(limit as string))
//     })
//   } catch (error) {
//     console.error('Erro ao listar tickets:', error)
//     res.status(500).json({ error: 'Erro interno' })
//   }
// }

// export const approvePayment = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params
//     await prisma.$transaction([
//       prisma.ticket.update({ where: { id }, data: { paymentStatus: 'PAID' } }),
//       prisma.payment.updateMany({ where: { ticketId: id },
//         data: { status: 'approved', paidAt: new Date() } })
//     ])
//     res.json({ success: true, message: 'Pagamento aprovado com sucesso' })
//   } catch (error) {
//     console.error('Erro ao aprovar pagamento:', error)
//     res.status(500).json({ error: 'Erro interno' })
//   }
// }

// export const getStats = async (req: Request, res: Response) => {
//   try {
//     const [totalTickets, paidTickets, revenueData] = await Promise.all([
//       prisma.ticket.count(),
//       prisma.ticket.count({ where: { paymentStatus: 'PAID' } }),
//       prisma.ticket.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { amount: true } })
//     ])
//     res.json({
//       totalTickets,
//       paidTickets,
//       pendingTickets: totalTickets - paidTickets,
//       totalRevenue: revenueData._sum.amount ?? 0
//     })
//   } catch (error) {
//     console.error('Erro ao buscar estatísticas:', error)
//     res.status(500).json({ error: 'Erro interno' })
//   }
// }

// // CSV gerado no servidor — o token é passado via query param só para download direto
// export const exportTicketsCSV = async (req: Request, res: Response) => {
//   try {
//     const tickets = await prisma.ticket.findMany({
//       include: { user: true, payment: true, category: true },
//       orderBy: { createdAt: 'desc' }
//     })

//     const rows = [
//       ['Nome','CPF','Email','Telefone','Cidade','Categoria','Camisa','Status','Valor','Data Compra','Data Pagamento'],
//       ...tickets.map((t: any) => [
//         `"${t.user.name}"`, t.user.cpf, t.user.email, t.user.phone, `"${t.user.city}"`,
//         t.category.name, t.shirtSize,
//         t.paymentStatus === 'PAID' ? 'PAGO' : 'PENDENTE',
//         `R$ ${t.amount.toFixed(2)}`,
//         new Date(t.createdAt).toLocaleDateString('pt-BR'),
//         t.payment?.paidAt ? new Date(t.payment.paidAt).toLocaleDateString('pt-BR') : '-'
//       ])
//     ]

//     const csv = rows.map(r => r.join(';')).join('\n')
//     res.setHeader('Content-Type', 'text/csv; charset=utf-8')
//     res.setHeader('Content-Disposition',
//       `attachment; filename="tickets_${new Date().toISOString().split('T')[0]}.csv"`)
//     res.send('\uFEFF' + csv)
//   } catch (error) {
//     console.error('Erro ao exportar CSV:', error)
//     res.status(500).json({ error: 'Erro interno' })
//   }
// }



import { Request, Response } from 'express'
import { prisma } from '../prisma' // 

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

    // Buscar tickets incluindo a categoria e a corrida
    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        include: { 
          user: true, 
          payment: true,
          category: true,   
          race: true        
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      })
    ])

    const formattedTickets = tickets.map((ticket:any) => ({
      id: ticket.id,
      amount: ticket.amount,
      shirtSize: ticket.shirtSize,
      paymentStatus: ticket.paymentStatus,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      userId: ticket.userId,
      raceId: ticket.raceId,
      categoryId: ticket.categoryId,
      category: ticket.category?.name || 'Sem Categoria',           
      raceName: ticket.race?.name || 'Sem Corrida',               
      user: ticket.user,
      payment: ticket.payment
    }))

    res.json({
      data: formattedTickets,
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

export const exportTicketsCSV = async (req: Request, res: Response) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: { user: true, payment: true, category: true },
      orderBy: { createdAt: 'desc' }
    })

    const rows = [
      ['Nome','CPF','Email','Telefone','Cidade','Categoria','Camisa','Status','Valor','Data Compra','Data Pagamento'],
      ...tickets.map((t: any) => [
        `"${t.user.name}"`, t.user.cpf, t.user.email, t.user.phone, `"${t.user.city}"`,
        t.category?.name || 'Sem Categoria', t.shirtSize || '-',
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