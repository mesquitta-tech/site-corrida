import { useState } from 'react'

interface PixPaymentProps {
  qrCode: string   // base64 da imagem
  payload: string  // string copia-e-cola
  onGoToDashboard: () => void
}

export default function PixPayment({ qrCode, payload, onGoToDashboard }: PixPaymentProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(payload)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="text-center space-y-6">
      <div>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-900/50 mb-3">
          <span className="text-2xl">✅</span>
        </div>
        <h2 className="text-2xl font-display font-bold text-white">Ticket gerado!</h2>
        <p className="text-zinc-400 text-sm mt-1">Pague com PIX para confirmar sua vaga</p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <div className="p-3 bg-white rounded-2xl shadow-xl inline-block">
          <img src={`data:image/png;base64,${qrCode}`}
               alt="PIX QR Code" className="w-52 h-52" />
        </div>
      </div>

      {/* Copia e Cola */}
      {payload && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
            Ou use o código PIX copia e cola
          </p>
          <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2">
            <span className="flex-1 text-xs text-zinc-300 truncate font-mono">{payload}</span>
            <button onClick={handleCopy}
              className="shrink-0 text-xs font-semibold text-brand-400 hover:text-brand-300 transition">
              {copied ? '✓ Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-zinc-600">
        O pagamento pode levar alguns minutos para ser confirmado.
      </p>

      <button onClick={onGoToDashboard} className="btn-primary w-full">
        Ir para o Dashboard
      </button>
    </div>
  )
}
