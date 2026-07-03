'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  className?: string
  showLabel?: boolean
  onBack?: () => void
}

export function BackButton({ className = '', showLabel = false, onBack }: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition ${className}`}
      aria-label="Go back"
      title="Go back to previous page"
    >
      <ArrowLeft className="w-5 h-5 text-gray-700" />
      {showLabel && <span className="text-sm font-medium text-gray-700">Back</span>}
    </button>
  )
}
