import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  const adminExists = await prisma.user.findFirst({ where: { role: 'ADMIN' } })

  if (!adminExists) {
    await prisma.user.create({
      data: {
        name: 'Administrador Sistema',
        cpf: '00000000000',
        birthDate: new Date('1990-01-01'),
        gender: 'Outro',
        phone: '(11) 99999-9999',
        email: 'admin@corrida.com',
        city: 'São Paulo',
        password: await bcrypt.hash('admin123', 10),
        role: 'ADMIN'
      }
    })
    console.log('✅ Admin criado: admin@corrida.com / admin123')
  }

  console.log('🎉 Seed concluído!')
}

main()
  .catch(e => { console.error('❌ Erro no seed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
