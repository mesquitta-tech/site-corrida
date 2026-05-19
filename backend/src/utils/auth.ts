import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const getSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET não definido')
  return secret
}

export const hashPassword = (password: string) => bcrypt.hash(password, 10)

export const comparePassword = (password: string, hash: string) =>
  bcrypt.compare(password, hash)

export const generateToken = (userId: string, role: string): string =>
  jwt.sign({ userId, role }, getSecret(), { expiresIn: '7d' })

export const verifyToken = (token: string): { userId: string; role: string } =>
  jwt.verify(token, getSecret()) as { userId: string; role: string }

/** Valida dígitos verificadores do CPF */
export const isValidCPF = (cpf: string): boolean => {
  const c = cpf.replace(/\D/g, '')
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false
  const calc = (len: number) => {
    let sum = 0
    for (let i = 0; i < len; i++) sum += parseInt(c[i]) * (len + 1 - i)
    const r = (sum * 10) % 11
    return r >= 10 ? 0 : r
  }
  return calc(9) === parseInt(c[9]) && calc(10) === parseInt(c[10])
}
