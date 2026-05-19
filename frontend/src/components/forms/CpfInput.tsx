import { forwardRef, InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

/** Aplica máscara 000.000.000-00 e repassa valor limpo */
const CpfInput = forwardRef<HTMLInputElement, Props>(({ error, onChange, ...rest }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11)
    if (v.length > 9)      v = v.replace(/^(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4')
    else if (v.length > 6) v = v.replace(/^(\d{3})(\d{3})(\d+)/, '$1.$2.$3')
    else if (v.length > 3) v = v.replace(/^(\d{3})(\d+)/, '$1.$2')
    e.target.value = v
    onChange?.(e)
  }
  return (
    <div>
      <label className="label">CPF <span className="text-brand-500">*</span></label>
      <input ref={ref} className="input-field" placeholder="000.000.000-00"
             onChange={handleChange} {...rest} />
      {error && <p className="error-msg">{error}</p>}
    </div>
  )
})
CpfInput.displayName = 'CpfInput'
export default CpfInput
