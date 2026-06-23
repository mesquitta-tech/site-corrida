// backend/src/controllers/raceController.ts
import { Request, Response } from 'express'
import { prisma } from '../prisma'

// Criar corrida (admin)
export const createRace = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      date,
      time,
      location,
      city,
      state,
      maxParticipants,
      regulationUrl,
      registrationStart,
      registrationEnd,
      categories,
      hasShirts,
      shirtSizes,
    } = req.body

    // 🛡️ VALIDAÇÕES
    if (!name) return res.status(400).json({ error: 'Nome da corrida é obrigatório' })
    if (!location) return res.status(400).json({ error: 'Local é obrigatório' })
    if (!city) return res.status(400).json({ error: 'Cidade é obrigatória' })
    if (!state) return res.status(400).json({ error: 'Estado é obrigatório' })
    if (!maxParticipants) return res.status(400).json({ error: 'Capacidade máxima é obrigatória' })
    if (!registrationStart) return res.status(400).json({ error: 'Início das inscrições é obrigatório' })
    if (!registrationEnd) return res.status(400).json({ error: 'Fim das inscrições é obrigatório' })

    // 🔧 CORREÇÃO: Lidar com diferentes formatos de data
    let raceDateTime: Date

    // Caso 1: Frontend enviou date+time separados
    if (date && time && !date.includes('T')) {
      raceDateTime = new Date(`${date}T${time}:00`)
    } 
    // Caso 2: Frontend enviou date no formato ISO completo (ex: "2025-12-15T19:00:00.000Z")
    else if (date && date.includes('T')) {
      raceDateTime = new Date(date)
    }
    // Caso 3: Apenas date sem time
    else if (date && !time) {
      raceDateTime = new Date(`${date}T12:00:00`)
    }
    else {
      return res.status(400).json({ 
        error: 'Data e horário da corrida são obrigatórios' 
      })
    }

    // Validar se a data é válida
    if (isNaN(raceDateTime.getTime())) {
      return res.status(400).json({ 
        error: `Formato de data/hora inválido. Recebido: date=${date}, time=${time}` 
      })
    }

    // Validar categorias
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ error: 'Pelo menos uma categoria é obrigatória' })
    }

    // Processar registrationStart e registrationEnd
    let startDate: Date
    let endDate: Date

    if (registrationStart.includes('T')) {
      startDate = new Date(registrationStart)
    } else {
      startDate = new Date(`${registrationStart}T00:00:00`)
    }

    if (registrationEnd.includes('T')) {
      endDate = new Date(registrationEnd)
    } else {
      endDate = new Date(`${registrationEnd}T23:59:59`)
    }

    // Garantir que description não seja undefined
    const safeDescription = description && description.trim() !== '' 
      ? description 
      : 'Sem descrição'

    const race = await prisma.race.create({
      data: {
        name,
        description: safeDescription,
        date: raceDateTime,
        location,
        city,
        state,
        maxParticipants: Number(maxParticipants),
        regulationUrl: regulationUrl || null,
        registrationStart: startDate,
        registrationEnd: endDate,
        hasShirts: hasShirts ?? false,
        isActive: true,
        categories: {
          create: categories.map((cat: any) => ({
            name: cat.name,
            price: Number(cat.price),
          })),
        },
        shirtSizes: hasShirts && shirtSizes?.length
          ? {
              create: shirtSizes.map((size: any) => ({
                size: size.size,
                quantity: Number(size.quantity),
              })),
            }
          : undefined,
      },
      include: {
        categories: true,
        shirtSizes: true,
      },
    })

    res.status(201).json(race)
  } catch (error) {
    console.error('Erro detalhado ao criar corrida:', error)
    res.status(500).json({ 
      error: 'Erro interno ao criar corrida',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}


// Listar corridas (público + admin)
export const getRaces = async (req: Request, res: Response) => {
  try {
    const { active, upcoming, past } = req.query
    const where: any = {}

    if (active === 'true') where.isActive = true
    if (upcoming === 'true') where.date = { gte: new Date() }
    if (past === 'true') where.date = { lt: new Date() }

    const races = await prisma.race.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        categories: { orderBy: { name: 'asc' } },
        shirtSizes: true,
        _count: { select: { tickets: true } },
      },
    })

    // Calcular participantes pagos
    const racesWithStats = await Promise.all(
      races.map(async (race) => {
        const paidCount = await prisma.ticket.count({
          where: { raceId: race.id, paymentStatus: 'PAID' },
        })
        return {
          ...race,
          currentParticipants: paidCount,
        }
      })
    )

    res.json(racesWithStats)
  } catch (error) {
    console.error('Erro ao listar corridas:', error)
    res.status(500).json({ error: 'Erro ao listar corridas' })
  }
}

// Buscar uma corrida específica
export const getRaceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const race = await prisma.race.findUnique({
      where: { id },
      include: {
        categories: true,
        shirtSizes: true,
        tickets: {
          include: { user: true, category: true },
        },
      },
    })

    if (!race) return res.status(404).json({ error: 'Corrida não encontrada' })

    const paidCount = await prisma.ticket.count({
      where: { raceId: id, paymentStatus: 'PAID' },
    })

    res.json({ ...race, currentParticipants: paidCount })
  } catch (error) {
    console.error('Erro ao buscar corrida:', error)
    res.status(500).json({ error: 'Erro interno' })
  }
}

// Atualizar corrida (admin)
export const updateRace = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const {
      name,
      description,
      date,
      time,
      location,
      city,
      state,
      maxParticipants,
      regulationUrl,
      registrationStart,
      registrationEnd,
      isActive,
      hasShirts,
      categories,
      shirtSizes,
    } = req.body

    // 🛡️ VALIDAÇÃO DE DATA E HORA SE FOREM ENVIADAS NA ATUALIZAÇÃO
    let raceDateTime: Date | undefined = undefined
    if (date && time) {
      raceDateTime = new Date(`${date}T${time}:00`)
      if (isNaN(raceDateTime.getTime())) {
        return res.status(400).json({ 
          error: `O formato de data '${date}' ou hora '${time}' enviado para atualização é inválido.` 
        })
      }
    }

    // Atualizar dados básicos
    await prisma.race.update({
      where: { id },
      data: {
        name,
        description,
        date: raceDateTime,
        location,
        city,
        state,
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
        regulationUrl,
        registrationStart: registrationStart ? new Date(registrationStart) : undefined,
        registrationEnd: registrationEnd ? new Date(registrationEnd) : undefined,
        isActive,
        hasShirts,
      },
    })

    // Atualizar categorias (substituir)
    if (categories && Array.isArray(categories)) {
      await prisma.raceCategory.deleteMany({ where: { raceId: id } })
      await prisma.raceCategory.createMany({
        data: categories.map((cat: any) => ({
          raceId: id,
          name: cat.name,
          price: Number(cat.price),
        })),
      })
    }

    // Atualizar tamanhos de camisa
    if (hasShirts && shirtSizes && Array.isArray(shirtSizes)) {
      await prisma.shirtSize.deleteMany({ where: { raceId: id } })
      await prisma.shirtSize.createMany({
        data: shirtSizes.map((size: any) => ({
          raceId: id,
          size: size.size,
          quantity: Number(size.quantity),
        })),
      })
    } else if (hasShirts === false) {
      await prisma.shirtSize.deleteMany({ where: { raceId: id } })
    }

    const updated = await prisma.race.findUnique({
      where: { id },
      include: { categories: true, shirtSizes: true },
    })

    res.json(updated)
  } catch (error) {
    console.error('Erro ao atualizar corrida:', error)
    res.status(500).json({ error: 'Erro ao atualizar corrida' })
  }
}

// Excluir/arquivar corrida
export const deleteRace = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const ticketsCount = await prisma.ticket.count({ where: { raceId: id } })

    if (ticketsCount > 0) {
      await prisma.race.update({ where: { id }, data: { isActive: false } })
      res.json({ message: 'Corrida desativada (possui inscrições vinculadas)' })
    } else {
      await prisma.raceCategory.deleteMany({ where: { raceId: id } })
      await prisma.shirtSize.deleteMany({ where: { raceId: id } })
      await prisma.race.delete({ where: { id } })
      res.json({ message: 'Corrida excluída com sucesso' })
    }
  } catch (error) {
    console.error('Erro ao excluir corrida:', error)
    res.status(500).json({ error: 'Erro ao excluir corrida' })
  }
}

// Estatísticas detalhadas de uma corrida
export const getRaceStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const [totalTickets, paidTickets, totalRevenue, categoryBreakdown, sizeBreakdown] = await Promise.all([
      prisma.ticket.count({ where: { raceId: id } }),
      prisma.ticket.count({ where: { raceId: id, paymentStatus: 'PAID' } }),
      prisma.ticket.aggregate({
        where: { raceId: id, paymentStatus: 'PAID' },
        _sum: { amount: true },
      }),
      prisma.ticket.groupBy({
        by: ['categoryId'],
        where: { raceId: id },
        _count: true,
        _sum: { amount: true },
      }),
      prisma.ticket.groupBy({
        by: ['shirtSize'],
        where: { raceId: id, shirtSize: { not: null } },
        _count: true,
      }),
    ])

    const categories = await prisma.raceCategory.findMany({ where: { raceId: id } })
    // const categoryMap = new Map(categories.map(c => [c.id, c.name]))
    const categoryMap = new Map(categories.map((c: { id: string; name: string }) => [c.id, c.name]))



    const formattedBreakdown = categoryBreakdown.map(b => ({
      categoryId: b.categoryId,
      categoryName: categoryMap.get(b.categoryId) || 'Desconhecido',
      count: b._count,
      revenue: b._sum.amount || 0,
    }))

    res.json({
      totalTickets,
      paidTickets,
      pendingTickets: totalTickets - paidTickets,
      totalRevenue: totalRevenue._sum.amount || 0,
      categoryBreakdown: formattedBreakdown,
      sizeBreakdown: sizeBreakdown.map(s => ({ size: s.shirtSize, count: s._count })),
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    res.status(500).json({ error: 'Erro interno' })
  }
}