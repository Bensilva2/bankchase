'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useBanking } from '@/lib/banking-context'
import { CreditCard, Lock, Unlock, Eye, EyeOff, Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BackButton } from '@/components/back-button'

export default function CardsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { creditCards = [], toggleCardLock } = useBanking()
  const [showCardNumbers, setShowCardNumbers] = useState<Record<string, boolean>>({})
  const [selectedCard, setSelectedCard] = useState<any>(null)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-card">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const toggleShowCard = (cardId: string) => {
    setShowCardNumbers((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }))
  }

  const maskCardNumber = (cardNumber: string) => {
    if (showCardNumbers[cardNumber]) {
      return cardNumber
    }
    return '•••• •••• •••• ' + cardNumber.slice(-4)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card pb-8">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Card Management</h1>
              <p className="text-muted-foreground">Manage your credit and debit cards</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary transition">
            <Plus className="w-5 h-5" />
            Add Card
          </button>
        </div>

        {selectedCard ? (
          // Card Detail View
          <Card className="p-8 max-w-2xl">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-foreground">Card Details</h2>
              <button
                onClick={() => setSelectedCard(null)}
                className="text-muted-foreground hover:text-foreground text-2xl"
              >
                ×
              </button>
            </div>

            {/* Card Display */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 mb-8 text-white h-56 flex flex-col justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-2">Card Number</p>
                <p className="text-2xl font-mono tracking-widest">
                  {maskCardNumber(selectedCard.cardNumber)}
                </p>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-blue-100 text-xs mb-1">Card Holder</p>
                  <p className="font-semibold">{selectedCard.cardholderName}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-xs mb-1">Expires</p>
                  <p className="font-semibold">{selectedCard.expiryDate}</p>
                </div>
              </div>
            </div>

            {/* Card Actions */}
            <div className="space-y-4">
              <button
                onClick={() => toggleShowCard(selectedCard.cardNumber)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-background text-foreground rounded-lg hover:bg-card transition"
              >
                {showCardNumbers[selectedCard.cardNumber] ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
                {showCardNumbers[selectedCard.cardNumber] ? 'Hide' : 'Show'} Card Number
              </button>

              <button
                onClick={() => toggleCardLock?.(selectedCard.id)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
              >
                {selectedCard.locked ? (
                  <Unlock className="w-5 h-5" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
                {selectedCard.locked ? 'Unlock' : 'Lock'} Card
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-3 bg-background text-foreground rounded-lg hover:bg-card transition">
                <Settings className="w-5 h-5" />
                Card Settings
              </button>

              <button
                onClick={() => setSelectedCard(null)}
                className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary transition"
              >
                Close
              </button>
            </div>
          </Card>
        ) : (
          // Cards List
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creditCards.length > 0 ? (
              creditCards.map((card: any) => (
                <div
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className="cursor-pointer transform hover:scale-105 transition"
                >
                  <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white h-48 flex flex-col justify-between shadow-lg">
                    <div className="flex justify-between items-start">
                      <CreditCard className="w-8 h-8" />
                      {card.locked && <Lock className="w-5 h-5 text-yellow-300" />}
                    </div>
                    <div>
                      <p className="text-blue-100 text-xs mb-2">Card Number</p>
                      <p className="text-xl font-mono tracking-widest mb-4">
                        •••• •••• •••• {card.cardNumber.slice(-4)}
                      </p>
                      <div className="flex justify-between">
                        <div>
                          <p className="text-blue-100 text-xs">Card Holder</p>
                          <p className="font-semibold text-sm">{card.cardholderName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-blue-100 text-xs">Expires</p>
                          <p className="font-semibold text-sm">{card.expiryDate}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-foreground text-sm font-medium mt-2">{card.type}</p>
                </div>
              ))
            ) : (
              <Card className="col-span-full p-8 text-center">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No cards to display</p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
