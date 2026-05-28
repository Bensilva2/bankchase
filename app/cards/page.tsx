'use client'

import { useState } from 'react'
import { CreditCard, Lock, LockOpen, AlertTriangle, Calendar, DollarSign, Settings, Plus, ChevronDown, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'

interface Card {
  id: string
  type: 'debit' | 'credit'
  lastFour: string
  brand: 'Visa' | 'Mastercard'
  expiryMonth: number
  expiryYear: number
  isLocked: boolean
  spendingLimit?: number
  currentSpend?: number
  travelNoticeActive?: boolean
}

function CardsContent() {
  const [cards, setCards] = useState<Card[]>([
    {
      id: '1',
      type: 'debit',
      lastFour: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2026,
      isLocked: false,
      spendingLimit: 5000,
      currentSpend: 1234.56,
      travelNoticeActive: false,
    },
    {
      id: '2',
      type: 'credit',
      lastFour: '5555',
      brand: 'Mastercard',
      expiryMonth: 6,
      expiryYear: 2025,
      isLocked: false,
      spendingLimit: 10000,
      currentSpend: 3456.78,
      travelNoticeActive: true,
    },
  ])

  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [showCardOptions, setShowCardOptions] = useState(false)
  const [showTravelNotice, setShowTravelNotice] = useState(false)
  const [showSpendingLimit, setShowSpendingLimit] = useState(false)
  const [travelDestination, setTravelDestination] = useState('')
  const [travelStartDate, setTravelStartDate] = useState('')
  const [travelEndDate, setTravelEndDate] = useState('')
  const [newSpendingLimit, setNewSpendingLimit] = useState('')

  const handleLockCard = (cardId: string) => {
    setCards(
      cards.map((card) =>
        card.id === cardId ? { ...card, isLocked: !card.isLocked } : card
      )
    )
    const card = cards.find((c) => c.id === cardId)
    toast.success(card?.isLocked ? 'Card unlocked' : 'Card locked')
  }

  const handleSetTravelNotice = () => {
    if (!travelDestination || !travelStartDate || !travelEndDate) {
      toast.error('Please fill in all travel details')
      return
    }

    if (selectedCard) {
      setCards(
        cards.map((card) =>
          card.id === selectedCard.id
            ? { ...card, travelNoticeActive: true }
            : card
        )
      )
      toast.success(`Travel notice set for ${travelDestination}`)
      setShowTravelNotice(false)
      setTravelDestination('')
      setTravelStartDate('')
      setTravelEndDate('')
    }
  }

  const handleSetSpendingLimit = () => {
    if (!newSpendingLimit || parseFloat(newSpendingLimit) <= 0) {
      toast.error('Please enter a valid spending limit')
      return
    }

    if (selectedCard) {
      setCards(
        cards.map((card) =>
          card.id === selectedCard.id
            ? { ...card, spendingLimit: parseFloat(newSpendingLimit) }
            : card
        )
      )
      toast.success(`Spending limit set to $${newSpendingLimit}`)
      setShowSpendingLimit(false)
      setNewSpendingLimit('')
    }
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">My Cards</h1>
          <p className="text-muted-foreground">Manage your debit and credit cards</p>
        </div>

        {/* Add Card Button */}
        <div className="mb-8">
          <button className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium">
            <Plus className="w-5 h-5" />
            Add New Card
          </button>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => setSelectedCard(card)}
              className={`relative rounded-2xl p-6 text-white overflow-hidden cursor-pointer transition-all ${
                card.type === 'debit'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-700'
                  : 'bg-gradient-to-br from-purple-500 to-purple-700'
              } ${selectedCard?.id === card.id ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-background' : ''}`}
            >
              {/* Card Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full" />
              </div>

              <div className="relative z-10">
                {/* Card Header */}
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <p className="text-sm opacity-80 capitalize">{card.type} Card</p>
                    <p className="text-lg font-semibold">{card.brand}</p>
                  </div>
                  <div
                    className={`p-2 rounded-lg ${card.isLocked ? 'bg-red-500/20' : 'bg-green-500/20'}`}
                  >
                    {card.isLocked ? (
                      <Lock className="w-5 h-5" />
                    ) : (
                      <LockOpen className="w-5 h-5" />
                    )}
                  </div>
                </div>

                {/* Card Status Badge */}
                {card.isLocked && (
                  <div className="absolute top-6 right-6 bg-red-500/80 px-3 py-1 rounded-full text-xs font-semibold">
                    LOCKED
                  </div>
                )}
                {card.travelNoticeActive && (
                  <div className="absolute top-6 right-6 bg-green-500/80 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Travel
                  </div>
                )}

                {/* Card Number */}
                <div className="mb-8 font-mono text-lg tracking-widest">
                  •••• •••• •••• {card.lastFour}
                </div>

                {/* Card Footer */}
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs opacity-80 mb-1">EXPIRES</p>
                    <p className="font-mono">
                      {card.expiryMonth.toString().padStart(2, '0')}/{card.expiryYear.toString().slice(-2)}
                    </p>
                  </div>
                  <CreditCard className="w-8 h-8 opacity-50" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Card Options */}
        {selectedCard && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Card Options</h2>
              <button
                onClick={() => {
                  setSelectedCard(null)
                  setShowCardOptions(false)
                }}
                className="text-muted-foreground hover:text-foreground transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Lock/Unlock */}
              <button
                onClick={() => handleLockCard(selectedCard.id)}
                className="w-full p-4 bg-background border border-border rounded-lg hover:border-primary/50 transition text-left flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  {selectedCard.isLocked ? (
                    <LockOpen className="w-5 h-5 text-primary" />
                  ) : (
                    <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {selectedCard.isLocked ? 'Unlock Card' : 'Lock Card'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCard.isLocked
                        ? 'Card is locked. Unlock to make purchases.'
                        : 'Lock to prevent unauthorized transactions'}
                    </p>
                  </div>
                </div>
                <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition" />
              </button>

              {/* Travel Notice */}
              <button
                onClick={() => setShowTravelNotice(!showTravelNotice)}
                className="w-full p-4 bg-background border border-border rounded-lg hover:border-primary/50 transition text-left flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium text-foreground">Travel Notice</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCard.travelNoticeActive
                        ? 'Travel notice is active'
                        : 'Set dates when traveling'}
                    </p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-muted-foreground group-hover:text-primary transition ${showTravelNotice ? 'rotate-180' : ''}`} />
              </button>

              {/* Spending Limit */}
              <button
                onClick={() => setShowSpendingLimit(!showSpendingLimit)}
                className="w-full p-4 bg-background border border-border rounded-lg hover:border-primary/50 transition text-left flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-medium text-foreground">Spending Limit</p>
                    <p className="text-sm text-muted-foreground">
                      ${selectedCard.currentSpend?.toFixed(2)} of ${selectedCard.spendingLimit?.toFixed(2)} used
                    </p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-muted-foreground group-hover:text-primary transition ${showSpendingLimit ? 'rotate-180' : ''}`} />
              </button>

              {/* Replace Card */}
              <button className="w-full p-4 bg-background border border-border rounded-lg hover:border-primary/50 transition text-left flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <div>
                    <p className="font-medium text-foreground">Replace Card</p>
                    <p className="text-sm text-muted-foreground">Lost or damaged? Order a replacement</p>
                  </div>
                </div>
                <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition" />
              </button>

              {/* Merchant Blocking */}
              <button className="w-full p-4 bg-background border border-border rounded-lg hover:border-primary/50 transition text-left flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="font-medium text-foreground">Merchant Categories</p>
                    <p className="text-sm text-muted-foreground">Block certain types of merchants</p>
                  </div>
                </div>
                <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition" />
              </button>
            </div>

            {/* Expandable Sections */}
            {showTravelNotice && (
              <div className="mt-6 pt-6 border-t border-border space-y-4">
                <h3 className="font-semibold text-foreground">Travel Notice Details</h3>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Destination</label>
                  <input
                    type="text"
                    placeholder="e.g., Paris, France"
                    value={travelDestination}
                    onChange={(e) => setTravelDestination(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Start Date</label>
                    <input
                      type="date"
                      value={travelStartDate}
                      onChange={(e) => setTravelStartDate(e.target.value)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">End Date</label>
                    <input
                      type="date"
                      value={travelEndDate}
                      onChange={(e) => setTravelEndDate(e.target.value)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSetTravelNotice}
                  className="w-full py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium"
                >
                  Set Travel Notice
                </button>
              </div>
            )}

            {showSpendingLimit && (
              <div className="mt-6 pt-6 border-t border-border space-y-4">
                <h3 className="font-semibold text-foreground">Set Spending Limit</h3>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Monthly Limit</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={newSpendingLimit}
                      onChange={(e) => setNewSpendingLimit(e.target.value)}
                      step="100"
                      min="0"
                      className="w-full pl-8 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSetSpendingLimit}
                  className="w-full py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium"
                >
                  Update Limit
                </button>
              </div>
            )}
          </div>
        )}

        {/* Card Transactions */}
        {selectedCard && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-foreground mb-6">Recent Transactions</h2>
            <div className="space-y-3">
              {[
                { description: 'Starbucks', amount: '5.42', date: 'Today', category: 'Coffee' },
                { description: 'Amazon', amount: '49.99', date: 'Yesterday', category: 'Shopping' },
                { description: 'Gas Station', amount: '52.00', date: '2 days ago', category: 'Fuel' },
              ].map((tx, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 hover:bg-background/50 rounded-lg transition">
                  <div>
                    <p className="font-medium text-foreground">{tx.description}</p>
                    <p className="text-sm text-muted-foreground">{tx.category} • {tx.date}</p>
                  </div>
                  <p className="font-semibold text-red-600 dark:text-red-400">-${tx.amount}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function CardsPage() {
  return (
    <ProtectedRoute>
      <Navigation />
      <CardsContent />
    </ProtectedRoute>
  )
}
