import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

// Deliberately tiny and unstyled-ish; projects bring their own look.

export const Button = (props: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button type="button" {...props} />
)

export const Field = ({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) => (
  <label style={{ display: 'grid', gap: 4 }}>
    <span>{label}</span>
    <input {...props} />
  </label>
)

export const ErrorBanner = ({ children }: { children?: ReactNode }) =>
  children ? (
    <p role="alert" style={{ color: 'crimson' }}>
      {children}
    </p>
  ) : null
