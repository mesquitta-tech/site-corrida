/// <reference types="node" />
import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados (Corrida & Categorias)...')

  // 1. CRIAR O ADMINISTRADOR DO SISTEMA
  const adminEmail = 'admin@corrida.com'
  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } })

  let adminUser
  if (!adminExists) {
    adminUser = await prisma.user.create({
      data: {
        name: 'Administrador Sistema',
        cpf: '12345678910',
        birthDate: new Date('1990-01-01T00:00:00.000Z'),
        gender: 'Outro',
        phone: '(11) 99999-9999',
        email: adminEmail,
        city: 'São Paulo',
        password: await bcrypt.hash('admin123', 10),
        role: 'ADMIN'
      }
    })
    console.log('✅ Usuário Admin criado: admin@corrida.com / admin123')
  } else {
    adminUser = adminExists
    console.log('⚠️ Usuário Admin já existia no banco.')
  }

  // // 2. CRIAR A CORRIDA E AS CATEGORIAS DINÂMICAS (Com campos estritos)
  // const raceName = 'Corrida Exemplo 2026'
  // let race = await prisma.race.findFirst({ where: { name: raceName } })

  // if (!race) {
  //   // Cria a corrida, as categorias e o estoque de camisetas (Nested Write)
  //   race = await prisma.race.create({
  //     data: {
  //       name: raceName,
  //       description: 'Grande evento de teste com categorias integradas ao banco de dados.',
  //       date: new Date('2026-12-15T08:00:00.000Z'),
  //       location: 'Parque Ibirapuera',
  //       city: 'São Paulo', // <-- Adicionado (Obrigatório)
  //       state: 'SP',       // <-- Adicionado (Obrigatório)
  //       maxParticipants: 500,
  //       registrationStart: new Date(), // <-- Adicionado (Obrigatório)
  //       registrationEnd: new Date('2026-12-10T23:59:59.000Z'), // <-- Adicionado (Obrigatório)
  //       isActive: true,
  //       hasShirts: true,
  //       categories: {
  //         create: [
  //           { name: '5km Geral', price: 59.90 },
  //           { name: '10km Geral', price: 79.90 },
  //           { name: '21km Meia Maratona', price: 119.90 }
  //         ]
  //       },
  //       shirtSizes: { // <-- Adicionado para alimentar a tabela ShirtSize
  //         create: [
  //           { size: 'P', quantity: 100 },
  //           { size: 'M', quantity: 150 },
  //           { size: 'G', quantity: 150 },
  //           { size: 'GG', quantity: 100 }
  //         ]
  //       }
  //     }
  //   })
  //   console.log(`✅ Corrida "${raceName}" e suas categorias criadas com sucesso!`)
  // } else {
  //   console.log(`⚠️ A corrida "${raceName}" já existe no banco de dados.`)
  // }

  // // 3. CRIAR UM ATLETA DE TESTE JÁ INSCRITO NA CORRIDA
  // const athleteEmail = 'atleta.teste@email.com'
  // const athleteExists = await prisma.user.findUnique({ where: { email: athleteEmail } })

  // if (!athleteExists) {
  //   // Buscar a categoria de 5km que acabamos de criar para vincular ao ticket
  //   const category5km = await prisma.category.findFirst({
  //     where: { raceId: race.id, name: '5km Geral' }
  //   })

  //   if (category5km) {
  //     await prisma.user.create({
  //       data: {
  //         name: 'Carlos Silva Atleta',
  //         cpf: '11122233344',
  //         birthDate: new Date('1995-05-15T00:00:00.000Z'),
  //         gender: 'Masculino',
  //         phone: '(11) 98888-8888',
  //         email: athleteEmail,
  //         city: 'São Paulo',
  //         password: await bcrypt.hash('atleta123', 10),
  //         role: 'ATHLETE',
  //         tickets: {
  //           create: {
  //             raceId: race.id,
  //             categoryId: category5km.id,
  //             shirtSize: 'M',
  //             amount: category5km.price,
  //             paymentStatus: 'PAID', // Já inicia como pago para testes
  //             payment: {
  //               create: {
  //                 gateway: 'asaas',
  //                 transactionId: 'pay_seed_mock_123456',
  //                 qrCode: '00020101021243650016BR.GOV.BCB.PIX...',
  //                 payload: 'pix_copia_e_cola_simulado_seed',
  //                 status: 'CONFIRMED',
  //                 paidAt: new Date()
  //               }
  //             }
  //           }
  //         }
  //       }
  //     })
  //     console.log(`✅ Atleta de teste inscrito na corrida: ${athleteEmail} / atleta123`)
  //   }
  // }

  console.log('🎉 Operação de Seed concluída com total sucesso!')
}

main()
  .catch((e: unknown) => {
    if (e instanceof Error) {
      console.error('❌ Erro detectado no seed:', e.message)
    } else {
      console.error('❌ Erro desconhecido no seed:', e)
    }
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })