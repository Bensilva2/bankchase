'use client'

import { ArrowLeft } from 'lucide-react'
import { useNavigationHistory } from '@/hooks/use-navigation-history'

interface BackButtonProps {
  className?: string
  showLabel?: boolean
  onBack?: () => void
}

export function BackButton({ className = '', showLabel = false, onBack }: BackButtonProps) {
  const { goBack } = useNavigationHistory()

  const handleClick = () => {
    if (onBack) {
      onBack()
    } else {
      goBack()
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 p-2 hover:bg-background rounded-lg transition ${className}`}
      aria-label="Go back to previous page"
      title="Go back to previous page"
    >
      <ArrowLeft className="w-5 h-5 text-foreground" />
      {showLabel && <span className="text-sm font-medium text-foreground">Back</span>}
    </button>
  )
}
