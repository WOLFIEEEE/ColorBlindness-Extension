import { useEffect, useState } from 'react'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

interface ToastProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function Toast({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true))
    
    // Auto dismiss after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onDismiss(toast.id), 200)
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-800 text-white'
      case 'error':
        return 'bg-red-600 text-white'
      case 'info':
      default:
        return 'bg-dark text-cream'
    }
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      case 'info':
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  return (
    <div
      className={`
        px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium
        pointer-events-auto transform transition-all duration-200
        ${getStyles()}
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
      `}
    >
      {getIcon()}
      {toast.message}
    </div>
  )
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = (type: ToastMessage['type'], message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setToasts((prev) => [...prev, { id, type, message }])
  }

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const showSuccess = (message: string) => addToast('success', message)
  const showError = (message: string) => addToast('error', message)
  const showInfo = (message: string) => addToast('info', message)

  return {
    toasts,
    dismissToast,
    showSuccess,
    showError,
    showInfo,
  }
}

// Clipboard utility
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for older browsers or restricted contexts
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch {
      return false
    }
  }
}

