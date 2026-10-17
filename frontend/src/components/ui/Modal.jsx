import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  '2xl': 'max-w-4xl',
  '3xl': 'max-w-5xl',
  '4xl': 'max-w-6xl',
  '5xl': 'max-w-7xl',
  full: 'max-w-[95vw]'
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = '2xl',
  closeOnEsc = true,
  closeOnOverlayClick = true,
  showCloseButton = true,
  className = ''
}) {
  const modalRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (closeOnEsc && e.key === 'Escape') {
        e.preventDefault()
        onClose?.()
      }
    }

    // Save current scroll position / prevent body background scrolling
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, closeOnEsc, onClose])

  if (!isOpen) return null

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES['2xl']

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
          onClose?.()
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        className={`relative w-full ${sizeClass} my-auto rounded-2xl bg-white dark:bg-[#16162a] border border-gray-100 dark:border-[#2a2a46] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-200 ease-out transform scale-100 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between px-6 py-4.5 border-b border-gray-100 dark:border-[#252542] bg-gray-50/70 dark:bg-[#1a1a32]/60 shrink-0">
            <div className="min-w-0 pr-4">
              {title && (
                <h3
                  id="modal-title"
                  className="text-lg font-bold text-gray-900 dark:text-white leading-snug truncate"
                >
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 dark:hover:text-gray-200 dark:hover:bg-[#2a2a48] transition-colors shrink-0 ml-auto"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {children}
        </div>

        {/* Modal Footer (if provided) */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-[#252542] bg-gray-50/70 dark:bg-[#1a1a32]/60 flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
