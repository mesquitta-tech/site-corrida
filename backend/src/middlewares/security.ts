

// // backend/src/middlewares/security.ts
// import { Request, Response, NextFunction } from 'express'
// import rateLimit from 'express-rate-limit'

// // Rate limiting para login
// export const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutos
//   max: 5, // 5 tentativas
//   message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
//   standardHeaders: true,
//   legacyHeaders: false,
// })

// // Rate limit geral da API
// export const apiLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hora
//   max: 100, // 100 requisições por hora
//   message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
//   standardHeaders: true,
//   legacyHeaders: false,
// })

// // Sanitização de inputs (remove tags HTML)
// export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
//   const sanitize = (obj: any) => {
//     if (typeof obj === 'string') {
//       return obj.replace(/[<>]/g, '') // Remove < e >
//     }
//     if (typeof obj === 'object' && obj !== null) {
//       Object.keys(obj).forEach(key => {
//         obj[key] = sanitize(obj[key])
//       })
//     }
//     return obj
//   }
  
//   if (req.body) req.body = sanitize(req.body)
//   if (req.query) req.query = sanitize(req.query)
//   if (req.params) req.params = sanitize(req.params)
  
//   next()
// }

// // Prevenção básica de SQL Injection
// // export const preventSQLInjection = (req: Request, res: Response, next: NextFunction) => {
// //   const sqlPatterns = /(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b|\bjoin\b)/i
  
// //   const checkValue = (value: any): boolean => {
// //     if (typeof value === 'string' && sqlPatterns.test(value.toLowerCase())) {
// //       return true
// //     }
// //     return false
// //   }
  
// //   const checkObject = (obj: any): boolean => {
// //     if (!obj) return false
// //     for (let key in obj) {
// //       if (checkValue(obj[key])) return true
// //       if (typeof obj[key] === 'object' && checkObject(obj[key])) return true
// //     }
// //     return false
// //   }
  
// //   if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
// //     return res.status(400).json({ error: 'Requisição inválida' })
// //   }
  
// //   next()
// // }



// // Adicione esta função no security.ts
// export const preventSQLInjection = (req: Request, res: Response, next: NextFunction) => {
//   // Lista de padrões suspeitos
//   const sqlPatterns = [
//     /\bselect\b.*\bfrom\b/i,
//     /\binsert\b.*\binto\b/i,
//     /\bupdate\b.*\bset\b/i,
//     /\bdelete\b.*\bfrom\b/i,
//     /\bdrop\b.*\btable\b/i,
//     /\bunion\b.*\bselect\b/i,
//     /\bexec\b|execute\b/i,
//     /'.*--/,
//     /'.*;/
//   ];
  
//   const checkValue = (value: any): boolean => {
//     if (typeof value === 'string') {
//       const lowerValue = value.toLowerCase();
//       return sqlPatterns.some(pattern => pattern.test(lowerValue));
//     }
//     return false;
//   };
  
//   const checkObject = (obj: any): boolean => {
//     if (!obj) return false;
//     for (let key in obj) {
//       if (checkValue(obj[key])) return true;
//       if (typeof obj[key] === 'object' && checkObject(obj[key])) return true;
//     }
//     return false;
//   };
  
//   if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
//     console.log(`🔒 SQL Injection bloqueada: ${req.ip} - ${req.path}`);
//     return res.status(400).json({ 
//       error: 'Requisição inválida',
//       message: 'Padrão SQL detectado'
//     });
//   }
  
//   next();
// };




// // Log de atividades suspeitas
// export const securityLog = (req: Request, res: Response, next: NextFunction) => {
//   const start = Date.now()
  
//   res.on('finish', () => {
//     // Log apenas para tentativas de acesso não autorizado
//     if (res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 429) {
//       console.log(JSON.stringify({
//         timestamp: new Date().toISOString(),
//         ip: req.ip || req.socket.remoteAddress,
//         method: req.method,
//         path: req.path,
//         status: res.statusCode,
//         userAgent: req.get('user-agent'),
//         userId: (req as any).userId || 'anonymous'
//       }))
//     }
//   })
  
//   next()
// }

// // Headers de segurança adicionais
// export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
//   // Prevenir clickjacking
//   res.setHeader('X-Frame-Options', 'DENY')
  
//   // Prevenir MIME type sniffing
//   res.setHeader('X-Content-Type-Options', 'nosniff')
  
//   // Habilitar XSS protection
//   res.setHeader('X-XSS-Protection', '1; mode=block')
  
//   // Referrer Policy
//   res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  
//   next()
// }

// // ========== FUNÇÕES DE VALIDAÇÃO ==========

// // Validação de email
// export const validateEmail = (email: string): boolean => {
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
//   return emailRegex.test(email)
// }

// // Validação de CPF
// export const validateCPF = (cpf: string): boolean => {
//   cpf = cpf.replace(/[^\d]/g, '')
  
//   if (cpf.length !== 11) return false
//   if (/^(\d)\1{10}$/.test(cpf)) return false
  
//   let sum = 0
//   let remainder
  
//   for (let i = 1; i <= 9; i++) {
//     sum += parseInt(cpf.substring(i - 1, i)) * (11 - i)
//   }
  
//   remainder = (sum * 10) % 11
//   if (remainder === 10 || remainder === 11) remainder = 0
//   if (remainder !== parseInt(cpf.substring(9, 10))) return false
  
//   sum = 0
//   for (let i = 1; i <= 10; i++) {
//     sum += parseInt(cpf.substring(i - 1, i)) * (12 - i)
//   }
  
//   remainder = (sum * 10) % 11
//   if (remainder === 10 || remainder === 11) remainder = 0
//   if (remainder !== parseInt(cpf.substring(10, 11))) return false
  
//   return true
// }

// // Validação de senha forte
// export const validateStrongPassword = (password: string): { valid: boolean; errors: string[] } => {
//   const errors: string[] = []
  
//   if (password.length < 8) errors.push('Mínimo de 8 caracteres')
//   if (!/[A-Z]/.test(password)) errors.push('Uma letra maiúscula')
//   if (!/[a-z]/.test(password)) errors.push('Uma letra minúscula')
//   if (!/[0-9]/.test(password)) errors.push('Um número')
//   if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Um caractere especial')
  
//   return { valid: errors.length === 0, errors }
// }

// // Validação de telefone
// export const validatePhone = (phone: string): boolean => {
//   const phoneRegex = /^\(?[1-9]{2}\)? ?(?:[2-8]|9[0-9])[0-9]{3}\-?[0-9]{4}$/
//   return phoneRegex.test(phone)
// }

// // Validação de nome (sem caracteres especiais)
// export const validateName = (name: string): boolean => {
//   const nameRegex = /^[a-zA-ZÀ-ÿ\s]{3,}$/
//   return nameRegex.test(name)
// }

// // Sanitização adicional para strings
// export const sanitizeString = (str: string): string => {
//   if (!str) return ''
//   return str
//     .replace(/[<>]/g, '')
//     .replace(/&/g, '&amp;')
//     .replace(/</g, '&lt;')
//     .replace(/>/g, '&gt;')
//     .trim()
// }






// backend/src/middlewares/security.ts
import { Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'

// ========== RATE LIMITING ==========

// Rate limiting para login
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Rate limit geral da API
export const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 100, // 100 requisições por hora
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// ========== SANITIZAÇÃO ==========

// Sanitização de inputs (remove tags HTML)
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any) => {
    if (typeof obj === 'string') {
      return obj.replace(/[<>]/g, '') // Remove < e >
    }
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        obj[key] = sanitize(obj[key])
      })
    }
    return obj
  }
  
  if (req.body) req.body = sanitize(req.body)
  if (req.query) req.query = sanitize(req.query)
  if (req.params) req.params = sanitize(req.params)
  
  next()
}

// ========== PREVENÇÃO SQL INJECTION ==========

export const preventSQLInjection = (req: Request, res: Response, next: NextFunction) => {
  // Lista de padrões suspeitos de SQL Injection
  const sqlPatterns = [
    /\bselect\b.*\bfrom\b/i,
    /\binsert\b.*\binto\b/i,
    /\bupdate\b.*\bset\b/i,
    /\bdelete\b.*\bfrom\b/i,
    /\bdrop\b.*\btable\b/i,
    /\bunion\b.*\bselect\b/i,
    /\bexec\b|\bexecute\b/i,
    /'.*--/,          
    /'.*;/,            // Término de statement
    /\bOR\b.*=.*=/i,   // OR 1=1
    /\bAND\b.*=.*=/i,  // AND 1=1
  ];
  
  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      return sqlPatterns.some(pattern => pattern.test(lowerValue));
    }
    return false;
  };
  
  const checkObject = (obj: any): boolean => {
    if (!obj) return false;
    for (let key in obj) {
      if (checkValue(obj[key])) return true;
      if (typeof obj[key] === 'object' && checkObject(obj[key])) return true;
    }
    return false;
  };
  
  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    console.log(`🔒 SQL Injection bloqueada: ${req.ip} - ${req.method} ${req.path}`);
    return res.status(400).json({ 
      error: 'Requisição inválida',
      message: 'Padrão SQL detectado na requisição'
    });
  }
  
  next();
};

// ========== LOGS DE SEGURANÇA ==========

export const securityLog = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log para tentativas de acesso não autorizado
    if (res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 429) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        ip: req.ip || req.socket.remoteAddress,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('user-agent'),
        userId: (req as any).userId || 'anonymous'
      }))
    }
  })
  
  next()
}

// ========== HEADERS DE SEGURANÇA ==========

export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevenir clickjacking
  res.setHeader('X-Frame-Options', 'DENY')
  
  // Prevenir MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')
  
  // Habilitar XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block')
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Desabilitar caching para rotas autenticadas (opcional)
  if (req.path.includes('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
  
  next()
}

// ========== VALIDAÇÕES ==========

// Validação de email
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validação de CPF
export const validateCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/[^\d]/g, '')
  
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false
  
  let sum = 0
  let remainder
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i)
  }
  
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cpf.substring(9, 10))) return false
  
  sum = 0
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i)
  }
  
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cpf.substring(10, 11))) return false
  
  return true
}

// Validação de senha forte
export const validateStrongPassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!password || password.length < 8) errors.push('Mínimo de 8 caracteres')
  if (!/[A-Z]/.test(password)) errors.push('Pelo menos uma letra maiúscula')
  if (!/[a-z]/.test(password)) errors.push('Pelo menos uma letra minúscula')
  if (!/[0-9]/.test(password)) errors.push('Pelo menos um número')
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Pelo menos um caractere especial')
  
  return { valid: errors.length === 0, errors }
}

// Validação de telefone
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\(?[1-9]{2}\)? ?(?:[2-8]|9[0-9])[0-9]{3}\-?[0-9]{4}$/
  return phoneRegex.test(phone)
}

// Validação de nome (sem caracteres especiais)
export const validateName = (name: string): boolean => {
  const nameRegex = /^[a-zA-ZÀ-ÿ\s]{3,}$/
  return nameRegex.test(name)
}

// Sanitização adicional para strings
export const sanitizeString = (str: string): string => {
  if (!str) return ''
  return str
    .replace(/[<>]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim()
}