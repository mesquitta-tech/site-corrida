import { Request, Response, NextFunction } from 'express'

export const methodGuard = (allowedMethods: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!allowedMethods.includes(req.method)) {
            return res.status(405).json({
                error: 'Método não permitido',
                allowed: allowedMethods
            })
        }
        next()
    }
}

// Middleware para todas as rotas API
export const apiMethodGuard = (req: Request, res: Response, next: NextFunction) => {
    const allowed = ['GET', 'POST', 'OPTIONS']
    
    if (!allowed.includes(req.method)) {
        return res.status(405).json({
            error: `Método ${req.method} não permitido. Use: ${allowed.join(', ')}`
        })
    }
    next()
}