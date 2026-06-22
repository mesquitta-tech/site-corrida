// backend/src/utils/asaas.ts
const getConfig = () => {
  const API_KEY = process.env.ASAAS_API_KEY
  const BASE_URL = process.env.ASAAS_URL
  if (!API_KEY || !BASE_URL) throw new Error('ASAAS_API_KEY ou ASAAS_URL não definidos')
  return { API_KEY, BASE_URL }
}

interface PixPaymentResponse {
  transactionId: string
  qrCode: string
  payload: string
  status: string
}

const cleanCpf = (cpf: string): string => {
  return cpf.replace(/\D/g, '')
}

export async function createPixPayment(
  amount: number,
  name: string,
  cpf: string,
  email: string,
  description: string
): Promise<PixPaymentResponse> {
  const { API_KEY, BASE_URL } = getConfig()
  const cleanCpfValue = cleanCpf(cpf)

  // 🔧 HEADER CORRETO: 'access_token' (minúsculo, com underline)
  const headers = {
    'access_token': API_KEY,
    'Content-Type': 'application/json'
  }

  console.log("📝 [ASAAS] Dados:")
  console.log("   Nome:", name)
  console.log("   CPF:", cleanCpfValue)
  console.log("   Email:", email)
  console.log("   Valor:", amount)
  console.log("   API Key (primeiros 10 chars):", API_KEY.substring(0, 10) + "...")

  try {
    // 1. Criar cliente
    console.log("👤 Criando cliente...")
    const customerRes = await fetch(`${BASE_URL}/customers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: name.substring(0, 100),
        cpfCnpj: cleanCpfValue,
        email,
        notificationDisabled: true
      })
    })

    if (!customerRes.ok) {
      const err = await customerRes.json()
      console.error('❌ Erro resposta cliente:', err)
      throw new Error(`Erro ao criar cliente: ${err.errors?.[0]?.description || JSON.stringify(err)}`)
    }

    const customer = await customerRes.json()
    console.log(`✅ Cliente criado: ${customer.id}`)

    // 2. Criar cobrança PIX
    console.log("💰 Criando pagamento PIX...")
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 3)
    const formattedDueDate = dueDate.toISOString().split('T')[0]

    const paymentRes = await fetch(`${BASE_URL}/payments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customer: customer.id,
        billingType: 'PIX',
        value: amount,
        dueDate: formattedDueDate,
        description: description.substring(0, 80)
      })
    })

    if (!paymentRes.ok) {
      const err = await paymentRes.json()
      console.error('❌ Erro resposta pagamento:', err)
      throw new Error(`Erro ao criar pagamento: ${err.errors?.[0]?.description || JSON.stringify(err)}`)
    }

    const payment = await paymentRes.json()
    console.log(`✅ Pagamento criado: ${payment.id}`)

    // 3. Aguardar e tentar obter QR Code
    console.log("⏳ Aguardando 3 segundos para o QR Code...")
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 4. Obter QR Code (usando MESMO header)
    console.log("📱 Obtendo QR Code...")
    const qrRes = await fetch(`${BASE_URL}/payments/${payment.id}/pixQrCode`, { headers })

    if (!qrRes.ok) {
      const err = await qrRes.json()
      console.error('❌ Erro QR Code:', err)
      throw new Error(`Erro ao obter QR Code: ${err.errors?.[0]?.description || JSON.stringify(err)}`)
    }

    const qrData = await qrRes.json()
    console.log('✅ QR Code obtido com sucesso!')

    return {
      transactionId: payment.id,
      qrCode: qrData.encodedImage,
      payload: qrData.payload,
      status: payment.status
    }
  } catch (error) {
    console.error('❌ Erro no Asaas:', error)
    throw error
  }
}