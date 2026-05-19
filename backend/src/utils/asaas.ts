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

export async function createPixPayment(
  amount: number,
  name: string,
  cpf: string,
  email: string,
  description: string
): Promise<PixPaymentResponse> {
  const { API_KEY, BASE_URL } = getConfig()

  const headers = {
    'Access-Token': API_KEY,
    'Content-Type': 'application/json'
  }

  // 1. Criar ou reutilizar cliente
  const customerRes = await fetch(`${BASE_URL}/customers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, cpfCnpj: cpf, email })
  })
  if (!customerRes.ok) {
    const err = await customerRes.json()
    throw new Error(`Erro ao criar cliente Asaas: ${JSON.stringify(err)}`)
  }
  const customer = await customerRes.json()

  // 2. Criar cobrança PIX
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 3)
  const paymentRes = await fetch(`${BASE_URL}/payments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      customer: customer.id,
      billingType: 'PIX',
      value: amount,
      dueDate: dueDate.toISOString().split('T')[0],
      description
    })
  })
  if (!paymentRes.ok) {
    const err = await paymentRes.json()
    throw new Error(`Erro ao criar pagamento Asaas: ${JSON.stringify(err)}`)
  }
  const payment = await paymentRes.json()

  // 3. Obter QR Code
  const qrRes = await fetch(`${BASE_URL}/payments/${payment.id}/pixQrCode`, { headers })
  if (!qrRes.ok) {
    const err = await qrRes.json()
    throw new Error(`Erro ao obter QR Code Asaas: ${JSON.stringify(err)}`)
  }
  const qrData = await qrRes.json()

  return {
    transactionId: payment.id,
    qrCode: qrData.encodedImage,
    payload: qrData.payload,
    status: payment.status
  }
}
