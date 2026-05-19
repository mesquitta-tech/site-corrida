import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes } from 'react'

interface BaseProps {
  label: string
  error?: string
  required?: boolean
}

type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement> & { as?: 'input' }
type SelectProps = BaseProps & SelectHTMLAttributes<HTMLSelectElement> & {
  as: 'select'
  children: React.ReactNode
}

type FormFieldProps = InputProps | SelectProps

const FormField = forwardRef<HTMLInputElement | HTMLSelectElement, FormFieldProps>(
  ({ label, error, required, as = 'input', ...rest }, ref) => (
    <div>
      <label className="label">
        {label} {required && <span className="text-brand-500">*</span>}
      </label>
      {as === 'select' ? (
        <select
          ref={ref as React.Ref<HTMLSelectElement>}
          className="input-field"
          {...(rest as SelectHTMLAttributes<HTMLSelectElement>)}
        >
          {(rest as SelectProps).children}
        </select>
      ) : (
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          className="input-field"
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {error && <p className="error-msg">{error}</p>}
    </div>
  )
)
FormField.displayName = 'FormField'
export default FormField
