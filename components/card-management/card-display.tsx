import { Lock, CreditCard } from 'lucide-react'
import { CreditCard as CreditCardType } from '@/lib/banking-context'
import { formatCardNumber, getCreditUtilization, getUtilizationColor } from '@/lib/card-options'

interface CardDisplayProps {
  card: CreditCardType
  onClick?: () => void
  compact?: boolean
}

export function CardDisplay({ card, onClick, compact = false }: CardDisplayProps) {
  const utilization = getCreditUtilization(card.balance, card.creditLimit)
  const utilizationColor = getUtilizationColor(utilization)

  if (compact) {
    return (
      <div
        onClick={onClick}
        className="cursor-pointer transform hover:scale-105 transition"
      >
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-background h-48 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start">
            <CreditCard className="w-8 h-8" />
            {card.locked && <Lock className="w-5 h-5 text-yellow-300" />}
          </div>
          <div>
            <p className="text-blue-100 text-xs mb-2">Card Number</p>
            <p className="text-xl font-mono tracking-widest mb-4">
              {formatCardNumber(card.lastFour)}
            </p>
            <div className="flex justify-between">
              <div>
                <p className="text-blue-100 text-xs">Card Name</p>
                <p className="font-semibold text-sm">{card.name}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-xs">Expires</p>
                <p className="font-semibold text-sm">{card.expiryDate}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 flex justify-between items-center">
          <p className="text-foreground text-sm font-medium">{card.name}</p>
          <span className="text-xs text-muted-foreground px-2 py-1 bg-card rounded">
            ${card.balance.toFixed(2)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-background h-56 flex flex-col justify-between shadow-lg">
      <div>
        <p className="text-blue-100 text-sm mb-2">Card Number</p>
        <p className="text-2xl font-mono tracking-widest">
          {formatCardNumber(card.lastFour)}
        </p>
      </div>
      <div className="flex justify-between items-end">
        <div>
          <p className="text-blue-100 text-xs mb-1">Card Name</p>
          <p className="font-semibold">{card.name}</p>
        </div>
        <div className="text-right">
          <p className="text-blue-100 text-xs mb-1">Expires</p>
          <p className="font-semibold">{card.expiryDate}</p>
        </div>
      </div>
    </div>
  )
}

export function CardInfoGrid({ card }: { card: CreditCardType }) {
  const utilization = getCreditUtilization(card.balance, card.creditLimit)
  const utilizationColor = getUtilizationColor(utilization)

  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-card rounded-lg">
      <div>
        <p className="text-xs text-muted-foreground mb-1">Balance</p>
        <p className="text-lg font-semibold text-foreground">${card.balance.toFixed(2)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Credit Limit</p>
        <p className="text-lg font-semibold text-foreground">${card.creditLimit.toFixed(2)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Minimum Payment</p>
        <p className="text-lg font-semibold text-foreground">${card.minimumPayment.toFixed(2)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Rewards Points</p>
        <p className="text-lg font-semibold text-foreground">{card.rewards.toLocaleString()}</p>
      </div>
      <div className="col-span-2">
        <p className="text-xs text-muted-foreground mb-2">Credit Utilization</p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              utilization >= 80
                ? 'bg-red-500'
                : utilization >= 50
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
        <p className={`text-sm font-semibold mt-1 ${utilizationColor}`}>
          {utilization}% used
        </p>
      </div>
    </div>
  )
}
