
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { prisma } from './prisma'
import { 
  apiLimiter, 
  authLimiter,
  securityHeaders, 
  securityLog,
  sanitizeInput, 
  preventSQLInjection 
} from './middlewares/security'

import { apiMethodGuard } from './middlewares/methodGuard'

// Adicionar antes das rotas




import authRoutes    from './routes/auth'
import ticketRoutes  from './routes/tickets'
import adminRoutes   from './routes/admin'
import webhookRoutes from './routes/webhook'

const app = express()
const PORT = process.env.PORT || 3333

// ========== MIDDLEWARES DE SEGURANÇA ==========
app.use(helmet()) // Headers de segurança
app.use(compression()) // Compressão das respostas
app.use(securityHeaders) // Headers personalizados
app.use(securityLog) // Log de atividades suspeitas

// ========== CORS ==========
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
  ? process.env.FRONTEND_URL || 'https://corrida-superacao.vercel.app'
  : 'http://localhost:5173',
  credentials: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// ========== PARSERS COM LIMITE ==========
app.use(express.json({ limit: '5kb' })) // Limita tamanho do payload
app.use(express.urlencoded({ extended: true, limit: '5kb' }))

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload muito grande. Limite de 5kb.' })
  }
  next(err)
})

// ========== SANITIZAÇÃO ==========
app.use(sanitizeInput)
app.use(preventSQLInjection)  


// ========== RATE LIMITING ==========
app.use('/api/', apiLimiter) // Limite geral da API
app.use('/api/auth/login', authLimiter) // Limite específico para login

// ========== ROTAS ==========
app.use('/api/auth',    authRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/admin',   adminRoutes)
app.use('/webhooks',    webhookRoutes)
app.use(apiMethodGuard)


// ========== HEALTH CHECK ==========
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ 
      status: 'ok', 
      database: 'connected', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    })
  } catch {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected', 
      timestamp: new Date().toISOString() 
    })
  }
})

// ========== 404 HANDLER ==========
app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' })
})

// ========== ERROR HANDLER ==========
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Erro:', err.message)
  
  // Não expõe detalhes do erro em produção
  const message = process.env.NODE_ENV === 'production'
    ? 'Erro interno do servidor'
    : err.message
  
  res.status(500).json({ error: message })
})

// ========== INICIALIZAÇÃO ==========
app.listen(PORT, () => {
  console.log(`🚀 Servidor na porta ${PORT}`)
  console.log(`📦 Ambiente: ${process.env.NODE_ENV ?? 'development'}`)
  console.log(`🔒 Segurança: ${process.env.NODE_ENV === 'production' ? 'ATIVADA' : 'BÁSICA'}`)
})

// ========== SHUTDOWN ==========
process.on('SIGINT', async () => {
  await prisma.$disconnect()
  console.log('🔌 Servidor encerrado')
  process.exit(0)
})