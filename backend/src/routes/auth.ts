
// backend/src/routes/auth.ts
import { Router } from 'express'
import { prisma } from '../prisma'
import { comparePassword, generateToken, hashPassword } from '../utils/auth'
import { 
  validateCPF, 
  validateEmail, 
  validateStrongPassword,
  validatePhone,
  validateName,
  sanitizeString
} from '../middlewares/security'
import { authMiddleware } from '../middlewares/auth'

const router = Router()



// Rota de registro com validações completas
router.post('/register', async (req, res) => {
  try {
    const { 
      name, 
      cpf, 
      email, 
      password, 
      birthDate, 
      gender, 
      phone, 
      city 
    } = req.body

    // Sanitização dos campos
    const sanitizedName = sanitizeString(name)
    const sanitizedEmail = sanitizeString(email)
    const sanitizedCity = sanitizeString(city)

    // Validações de segurança
    if (!validateName(sanitizedName)) {
      return res.status(400).json({ 
        error: 'Nome inválido. Use apenas letras e mínimo 3 caracteres.' 
      })
    }
    
    if (!validateCPF(cpf)) {
      return res.status(400).json({ error: 'CPF inválido' })
    }
    
    if (!validateEmail(sanitizedEmail)) {
      return res.status(400).json({ error: 'Email inválido' })
    }
    
    if (!validatePhone(phone)) {
      return res.status(400).json({ 
        error: 'Telefone inválido. Use formato: (11) 99999-9999' 
      })
    }
    
    const passwordValidation = validateStrongPassword(password)
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        error: 'Senha fraca',
        details: passwordValidation.errors 
      })
    }
    
    // Verificar se usuário já existe
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: sanitizedEmail },
          { cpf: cpf.replace(/[^\d]/g, '') }
        ]
      }
    })
    
    if (existingUser) {
      return res.status(400).json({ error: 'Usuário já existe com este email ou CPF' })
    }
    
    // Hash da senha
    const hashedPassword = await hashPassword(password)
    
    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name: sanitizedName,
        cpf: cpf.replace(/[^\d]/g, ''),
        birthDate: new Date(birthDate),
        gender,
        phone: phone.replace(/[^\d]/g, ''),
        email: sanitizedEmail,
        city: sanitizedCity,
        password: hashedPassword,
        role: 'ATHLETE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        cpf: true,
        phone: true,
        city: true
      }
    })
    
    const token = generateToken(user.id, user.role)
    
    res.status(201).json({
      token,
      user
    })
  } catch (error: any) {
    console.error('Erro no registro:', error)
    res.status(500).json({ error: 'Erro ao criar conta' })
  }
})

// Rota de login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' })
    }
    
    const sanitizedEmail = sanitizeString(email)
    
    const user = await prisma.user.findUnique({ 
      where: { email: sanitizedEmail }
    })
    
    if (!user) {
      return res.status(401).json({ error: 'Email ou senha inválidos' })
    }
    
    const validPassword = await comparePassword(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou senha inválidos' })
    }
    
    const token = generateToken(user.id, user.role)
    
    res.json({ 
      token, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error: any) {
    console.error('Erro no login:', error)
    res.status(500).json({ error: 'Erro interno no servidor' })
  }
})
// Rota para buscar usuário atual (protegida com authMiddleware)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // req.userId é definido pelo authMiddleware
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    res.json(user)
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    res.status(500).json({ error: 'Erro interno ao buscar usuário' })
  }
})

export default router