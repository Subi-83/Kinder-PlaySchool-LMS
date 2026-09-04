import React from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

// Single source of truth for button styling. Renders a <button>, or a
// react-router <Link> when `to` is given, so it can be used for both
// actions and navigation while keeping one visual language.
const VARIANTS = {
  primary: 'bg-primary-main hover:bg-primary-dark text-white shadow-sm hover:shadow disabled:hover:bg-primary-main',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-[#2a2a4a] dark:hover:bg-[#34345a] dark:text-gray-200',
  outline: 'border border-gray-300 dark:border-[#3a3a5a] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#22223c] bg-transparent',
  ghost: 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a4a] bg-transparent shadow-none',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
}

function Button({
  as,
  to,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  children,
  ...rest
}) {
  const classes = `inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1a1a2e] disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${fullWidth ? 'w-full' : ''} ${className}`

  const content = (
    <>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        Icon && iconPosition === 'left' && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
    </>
  )

  if (to && !disabled) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    )
  }

  const Component = as || 'button'
  return (
    <Component type={Component === 'button' ? 'button' : undefined} className={classes} disabled={disabled || loading} {...rest}>
      {content}
    </Component>
  )
}

export default Button
