// import { Request, Response, NextFunction } from 'express'
// import { verifyToken } from '../utils/auth'

// declare global {
//   namespace Express {
//     interface Request {
//       userId: string
//       userRole: string
//     }
//   }
// }

// export function authMiddleware(req: Request, res: Response, next: NextFunction) {
//   const authHeader = req.headers.authorization
//   if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' })

//   const token = authHeader.split(' ')[1]
//   try {
//     const decoded = verifyToken(token)
//     req.userId = decoded.userId
//     req.userRole = decoded.role
    
//     next()
//   } catch {
//     return res.status(401).json({ error: 'Token inválido ou expirado' })
//   }
// }

// export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
//   if (req.userRole !== 'ADMIN')
//     return res.status(403).json({ error: 'Acesso restrito a administradores' })
//   next()
// }






// backend/src/middlewares/auth.ts
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
  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = verifyToken(token)
    req.userId = decoded.userId
    req.userRole = decoded.role
    
    // 🔥 VALIDAÇÃO: Verificar se o userId da requisição é o mesmo do token
    // Apenas se o userId for passado como parâmetro ou body
    const requestedUserId = req.params.userId || req.body.userId || req.query.userId
    
    if (requestedUserId && requestedUserId !== decoded.userId) {
      // Se o usuário não for admin, bloqueia o acesso
      if (decoded.role !== 'ADMIN') {
        console.warn(`⚠️ Tentativa de acesso não autorizado: Usuário ${decoded.userId} tentou acessar dados de ${requestedUserId}`)
        return res.status(403).json({ 
          error: 'Acesso negado: você não tem permissão para acessar dados de outro usuário' 
        })
      }
    }
    
    next()
  } catch (error) {
    console.error('Erro na autenticação:', error)
    return res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' })
  }
  next()
}

// 🔥 NOVO: Middleware para verificar se o usuário é o mesmo OU admin
export function verifyOwnershipOrAdmin(req: Request, res: Response, next: NextFunction) {
  const requestedUserId = req.params.userId || req.body.userId || req.query.userId
  
  if (!requestedUserId) {
    // Se não houver userId na requisição, apenas prossegue
    return next()
  }
  
  if (req.userId !== requestedUserId && req.userRole !== 'ADMIN') {
    console.warn(`⚠️ Tentativa de acesso não autorizado: Usuário ${req.userId} tentou acessar dados de ${requestedUserId}`)
    return res.status(403).json({ 
      error: 'Acesso negado: você não tem permissão para acessar dados de outro usuário' 
    })
  }
  
  next()
}