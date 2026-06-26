// backend/src/controllers/userController.ts
import { Request, Response } from 'express'
import { prisma } from '../prisma'
import bcrypt from 'bcryptjs'

// 🔹 Buscar usuário atual (próprio)
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        city: true,
        role: true,
        createdAt: true
      }
    })
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }
    
    res.json(user)
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    res.status(500).json({ error: 'Erro interno' })
  }
}

// 🔹 Buscar usuário por ID (com validação de ownership)
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        city: true,
        role: true,
        createdAt: true
      }
    })
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }
    
    res.json(user)
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    res.status(500).json({ error: 'Erro interno' })
  }
}

// 🔹 Atualizar usuário (com validação de ownership)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId || req.userId
    const { name, phone, city, password } = req.body
    
    const updateData: any = {}
    if (name) updateData.name = name
    if (phone) updateData.phone = phone
    if (city) updateData.city = city
    
    // Se for admin, pode atualizar role
    if (req.userRole === 'ADMIN' && req.body.role) {
      updateData.role = req.body.role
    }
    
    // Se tiver senha, faz hash
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        city: true,
        role: true,
        createdAt: true
      }
    })
    
    res.json(user)
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    res.status(500).json({ error: 'Erro interno' })
  }
}

// 🔹 Deletar usuário (apenas admin ou próprio)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }
    
    // Não permitir deletar o próprio admin
    if (userId === req.userId && req.userRole === 'ADMIN') {
      return res.status(400).json({ error: 'Não é possível deletar o próprio admin' })
    }
    
    // Deletar tickets e pagamentos relacionados (cascade)
    await prisma.user.delete({
      where: { id: userId }
    })
    
    res.json({ message: 'Usuário deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    res.status(500).json({ error: 'Erro interno' })
  }
}

// 🔹 Listar todos os usuários (apenas admin)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { search, page = '1', limit = '50' } = req.query
    
    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { cpf: { contains: search as string } }
      ]
    }
    
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          cpf: true,
          phone: true,
          city: true,
          role: true,
          createdAt: true,
          _count: {
            select: { tickets: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      })
    ])
    
    res.json({
      data: users,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string))
    })
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    res.status(500).json({ error: 'Erro interno' })
  }
}