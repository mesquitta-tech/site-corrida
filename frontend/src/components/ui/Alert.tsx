interface AlertProps {
  type: 'error' | 'success' | 'info'
  children: React.ReactNode
}

const styles = {
  error:   'bg-red-950/60 border-red-800 text-red-300',
  success: 'bg-emerald-950/60 border-emerald-800 text-emerald-300',
  info:    'bg-blue-950/60 border-blue-800 text-blue-300'
}

export default function Alert({ type, children }: AlertProps) {
  return (
    <div className={`border rounded-xl px-4 py-3 text-sm ${styles[type]}`}>
      {children}
    </div>
  )
}
