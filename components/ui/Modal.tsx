'use client'

import { ReactNode, useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  icon?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' // ← Ajoutez cette ligne
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  icon,
  size = 'md' // ← Ajoutez avec valeur par défaut
}: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Définir les classes CSS selon la taille
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl'
  }

  return (
    <div 
      className="fixed inset-0 bg-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className={`bg-white rounded-2xl p-8 w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 animate-slideUp ${sizeClasses[size]}`} // ← Ajoutez la classe dynamique
      >
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {icon && <div className="text-primary text-xl">{icon}</div>}
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-danger hover:text-white transition-all duration-300 hover:rotate-90"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}