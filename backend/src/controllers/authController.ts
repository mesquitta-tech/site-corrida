import { Request, Response } from 'express'
import { prisma } from '../prisma'
import { hashPassword, comparePassword, generateToken, isValidCPF } from '../utils/auth'

export const register = async (req: Request, res: Response) => {
  try {
    const { name, cpf, birthDate, gender, phone, email, city, password } = req.body

    // Validação de CPF no servidor
    const cleanCpf = cpf?.replace(/\D/g, '')
    if (!isValidCPF(cleanCpf)) {
      return res.status(400).json({ error: 'CPF inválido' })
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { cpf: cleanCpf }] }
    })
    if (existingUser) {
      return res.status(400).json({ error: 'Já existe conta com este email ou CPF' })
    }

    const user = await prisma.user.create({
      data: {
        name,
        cpf: cleanCpf,
        birthDate: new Date(birthDate),
        gender,
        phone,
        email,
        city,
        password: await hashPassword(password),
        role: 'ATHLETE'
      },
      select: { id: true, name: true, email: true, role: true, cpf: true,
                phone: true, city: true, birthDate: true, gender: true }
    })

    res.status(201).json({ token: generateToken(user.id, user.role), user })
  } catch (error) {
    console.error('Erro no registro:', error)
    res.status(500).json({ error: 'Erro ao criar conta' })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ error: 'Email ou senha inválidos' })
    }

    res.json({
      token: generateToken(user.id, user.role),
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    })
  } catch (error) {
    console.error('Erro no login:', error)
    res.status(500).json({ error: 'Erro ao fazer login' })
  }
}

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, role: true, cpf: true,
                phone: true, city: true, birthDate: true, gender: true }
    })
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })
    res.json(user)
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    res.status(500).json({ error: 'Erro interno' })
  }
}
