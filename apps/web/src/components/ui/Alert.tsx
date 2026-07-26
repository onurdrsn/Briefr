import React from 'react'
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'

export interface AlertProps {
  variant?: 'danger' | 'success' | 'warning' | 'info'
  title?: string
  children: React.ReactNode
  onClose?: () => void
  className?: string
}

export function Alert({ variant = 'danger', title, children, onClose, className = '' }: AlertProps) {
  const getStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          container: 'bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-rose-500/5',
          icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
          title: 'text-rose-200 font-bold',
        }
      case 'success':
        return {
          container: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-emerald-500/5',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
          title: 'text-emerald-200 font-bold',
        }
      case 'warning':
        return {
          container: 'bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-amber-500/5',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
          title: 'text-amber-200 font-bold',
        }
      case 'info':
      default:
        return {
          container: 'bg-purple-500/10 border-purple-500/30 text-purple-300 shadow-purple-500/5',
          icon: <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />,
          title: 'text-purple-200 font-bold',
        }
    }
  }

  const styles = getStyles()

  return (
    <div
      className={`p-4 border rounded-xl flex items-start justify-between gap-3 shadow-lg transition-all duration-300 animate-in fade-in ${styles.container} ${className}`}
    >
      <div className="flex items-start gap-3">
        {styles.icon}
        <div className="space-y-1">
          {title && <h5 className={`text-sm ${styles.title}`}>{title}</h5>}
          <div className="text-xs leading-relaxed opacity-95">{children}</div>
        </div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800/40 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
