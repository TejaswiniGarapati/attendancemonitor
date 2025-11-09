import React, { useEffect } from 'react'
import { CheckCircle, AlertCircle, X } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  return (
    <div className={`fixed top-6 right-6 max-w-md rounded-lg shadow-xl p-4 flex items-start gap-3 animate-slide-in ${
      type === 'success'
        ? 'bg-green-500/10 border border-green-500/30'
        : 'bg-red-500/10 border border-red-500/30'
    }`}>
      {type === 'success' ? (
        <CheckCircle className={`h-5 w-5 flex-shrink-0 ${type === 'success' ? 'text-green-400' : 'text-red-400'}`} />
      ) : (
        <AlertCircle className={`h-5 w-5 flex-shrink-0 ${type === 'success' ? 'text-green-400' : 'text-red-400'}`} />
      )}
      <div className="flex-1">
        <p className={type === 'success' ? 'text-green-400' : 'text-red-400'}>
          {message}
        </p>
      </div>
      <button
        onClick={onClose}
        className={`text-gray-400 hover:${type === 'success' ? 'text-green-400' : 'text-red-400'} transition-colors`}
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}
