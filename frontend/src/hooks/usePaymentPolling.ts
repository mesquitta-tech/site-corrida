import { useEffect, useRef } from 'react'
import api from '../services/api'

/**
 * Faz polling em /api/tickets/my-ticket a cada `interval` ms
 * enquanto o status for PENDING, e chama `onPaid` quando confirmar.
 */
export function usePaymentPolling(
  isActive: boolean,
  onPaid: () => void,
  interval = 5000
) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    timerRef.current = setInterval(async () => {
      try {
        const { data } = await api.get('/api/tickets/my-ticket')
        if (data.paymentStatus === 'PAID') {
          clearInterval(timerRef.current!)
          onPaid()
        }
      } catch { /* ignora erros transientes */ }
    }, interval)

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isActive, onPaid, interval])
}
