import React, { useEffect, useRef } from 'react'
import { Check, Minus } from 'lucide-react'

// Custom checkbox: a real (visually hidden) native <input type="checkbox">
// drives a styled box, so keyboard/screen-reader behavior stays exactly
// like a normal checkbox while the visual reads as a designed control
// instead of the bare browser default. Supports a tri-state
// (indeterminate) look for table "select all" headers.
function Checkbox({ checked = false, indeterminate = false, onChange, disabled = false, label, size = 'md', className = '', ...rest }) {
  const inputRef = useRef(null)
  const boxSize = size === 'sm' ? 'h-[15px] w-[15px]' : 'h-[18px] w-[18px]'
  const iconSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = Boolean(indeterminate) && !checked
  }, [indeterminate, checked])

  const box = (
    <span
      className={`relative inline-flex ${boxSize} shrink-0 items-center justify-center rounded-[5px] border transition-colors duration-150 ${
        checked || indeterminate
          ? 'bg-primary-main border-primary-main'
          : 'bg-white dark:bg-[#10101d] border-gray-300 dark:border-[#3a3a5a] peer-hover:border-primary-mid peer-hover:dark:border-primary-main'
      } ${disabled ? 'opacity-50' : ''}`}
      aria-hidden="true"
    >
      {indeterminate && !checked && <Minus className={`${iconSize} text-white`} strokeWidth={3} />}
      {checked && <Check className={`${iconSize} text-white`} strokeWidth={3} />}
    </span>
  )

  const control = (
    <span className="relative inline-flex shrink-0">
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...rest}
      />
      <span className="pointer-events-none absolute -inset-1 rounded-md peer-focus-visible:ring-2 peer-focus-visible:ring-primary-main peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-[#1a1a2e]" />
      {box}
    </span>
  )

  if (!label) return <span className={className}>{control}</span>

  return (
    <label className={`inline-flex items-center gap-2 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
      {control}
      <span className={`text-sm ${disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>{label}</span>
    </label>
  )
}

export default Checkbox
