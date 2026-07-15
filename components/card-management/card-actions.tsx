import { Lock, Unlock, Eye, EyeOff, Settings, Trash2 } from 'lucide-react'
import { CreditCard as CreditCardType } from '@/lib/banking-context'

interface CardActionsProps {
  card: CreditCardType
  showCardNumber: boolean
  onToggleShow: () => void
  onToggleLock: () => void
  onSettings: () => void
  onDelete?: () => void
  isLoading?: boolean
}

export function CardActions({
  card,
  showCardNumber,
  onToggleShow,
  onToggleLock,
  onSettings,
  onDelete,
  isLoading = false
}: CardActionsProps) {
  return (
    <div className="space-y-3">
      <button
        onClick={onToggleShow}
        disabled={isLoading}
        className="w-full flex items-center gap-3 px-4 py-3 bg-background text-foreground rounded-lg hover:bg-card transition border border-border disabled:opacity-50"
      >
        {showCardNumber ? (
          <EyeOff className="w-5 h-5" />
        ) : (
          <Eye className="w-5 h-5" />
        )}
        {showCardNumber ? 'Hide' : 'Show'} Card Number
      </button>

      <button
        onClick={onToggleLock}
        disabled={isLoading}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition disabled:opacity-50 ${
          card.locked
            ? 'bg-green-100 text-green-600 hover:bg-green-200'
            : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
        }`}
      >
        {card.locked ? (
          <Unlock className="w-5 h-5" />
        ) : (
          <Lock className="w-5 h-5" />
        )}
        {card.locked ? 'Unlock' : 'Lock'} Card
      </button>

      <button
        onClick={onSettings}
        disabled={isLoading}
        className="w-full flex items-center gap-3 px-4 py-3 bg-background text-foreground rounded-lg hover:bg-card transition border border-border disabled:opacity-50"
      >
        <Settings className="w-5 h-5" />
        Card Settings
      </button>

      {onDelete && (
        <button
          onClick={onDelete}
          disabled={isLoading}
          className="w-full flex items-center gap-3 px-4 py-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
        >
          <Trash2 className="w-5 h-5" />
          Delete Card
        </button>
      )}
    </div>
  )
}
