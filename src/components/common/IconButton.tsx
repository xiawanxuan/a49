import React from 'react'
import { twMerge } from 'tailwind-merge'
import clsx from 'clsx'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  variant?: 'default' | 'primary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  active?: boolean
  label?: string
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'default',
  size = 'md',
  active = false,
  label,
  className,
  ...rest
}) => {
  const base =
    'relative inline-flex items-center justify-center font-mono transition-all duration-150 select-none disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60'

  const variants: Record<string, string> = {
    default:
      'bg-slate-900/60 border border-slate-700/60 text-slate-200 hover:bg-slate-800/80 hover:border-cyan-500/50 hover:text-cyan-300 active:bg-slate-950/80',
    primary:
      'bg-cyan-500/15 border border-cyan-400/60 text-cyan-300 hover:bg-cyan-500/25 hover:border-cyan-300/80 hover:shadow-[0_0_12px_rgba(0,229,255,0.25)] active:bg-cyan-600/30',
    danger:
      'bg-rose-500/10 border border-rose-500/50 text-rose-300 hover:bg-rose-500/20 hover:border-rose-400/70',
    ghost:
      'bg-transparent border border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200',
  }

  const activeVariant =
    'bg-cyan-500/20 border-cyan-400/80 text-cyan-200 shadow-[0_0_12px_rgba(0,229,255,0.3)]'

  const sizes: Record<string, string> = {
    sm: 'h-8 w-8 text-xs rounded-sm',
    md: 'h-10 w-10 text-sm rounded-sm',
    lg: 'h-12 w-12 text-base rounded-sm',
  }

  const iconSizes: Record<string, number> = {
    sm: 14,
    md: 18,
    lg: 22,
  }

  return (
    <button
      className={twMerge(clsx(base, variants[variant], sizes[size], active && activeVariant, className))}
      aria-label={label}
      title={label}
      {...rest}
    >
      {React.isValidElement(icon)
        ? React.cloneElement(icon as React.ReactElement, { size: iconSizes[size], strokeWidth: 1.75 })
        : icon}
    </button>
  )
}

export default IconButton
