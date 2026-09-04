import React from 'react'

// Icon-only control. `label` is required and is applied as aria-label +
// a native title tooltip so icon-only actions stay accessible and
// self-explanatory on hover, per the app's accessibility requirements.
function IconButton({ icon: Icon, label, variant = 'ghost', size = 'md', className = '', ...rest }) {
  const sizeClasses = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9'
  const variantClasses = variant === 'solid'
    ? 'bg-primary-main text-white hover:bg-primary-dark'
    : variant === 'subtle'
      ? 'bg-gray-100 dark:bg-[#2a2a4a] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#34345a]'
      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a4a] hover:text-gray-700 dark:hover:text-gray-200'

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main ${sizeClasses} ${variantClasses} ${className}`}
      {...rest}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
    </button>
  )
}

export default IconButton
