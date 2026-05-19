import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/auth'

declare global {
  namespace Express {
    interface Request {
      userId: string
      userRole: string
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' })

  const token = authHeader.split(' ')[1]
  try {
    const decoded = verifyToken(token)
    req.userId = decoded.userId
    req.userRole = decoded.role
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.userRole !== 'ADMIN')
    return res.status(403).json({ error: 'Acesso restrito a administradores' })
  next()
}
