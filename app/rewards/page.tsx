'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navigation } from '@/components/Navigation'
import { useBanking } from '@/lib/banking-context'
import { Gift, TrendingUp, Zap, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BackButton } from '@/components/back-button'

export default function RewardsPage() {
  const router = useRouter()
  const { userId, isLoaded } = useAuth()
  const { userProfile, redeemPoints, rewardRedemptions = [] } = useBanking()
  const [redeemAmount, setRedeemAmount] = useState('')
  const [redeemType, setRedeemType] = useState<'cashback' | 'travel' | 'giftcard' | 'statement'>('cashback')
  const [redeemSuccess, setRedeemSuccess] = useState(false)

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-card">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!userId) {
    router.push('/login')
    return null
  }

  const points = userProfile?.ultimateRewardsPoints || 0
  const maxRedeemAmount = Math.floor(points / 100)

  const handleRedeem = () => {
    if (!redeemAmount || parseFloat(redeemAmount) <= 0) {
      alert('Please enter a valid amount')
      return
    }
    if (parseFloat(redeemAmount) > maxRedeemAmount) {
      alert('Insufficient points')
      return
    }
    redeemPoints?.(parseInt(redeemAmount) * 100, redeemType)
    setRedeemSuccess(true)
    setRedeemAmount('')
    setTimeout(() => setRedeemSuccess(false), 3000)
  }

  const redemptionOptions = [
    {
      type: 'cashback' as const,
      title: 'Cash Back',
      description: 'Deposit directly to your account',
      icon: '💰',
    },
    {
      type: 'travel' as const,
      title: 'Travel',
      description: 'Book flights, hotels, and more',
      icon: '✈️',
    },
    {
      type: 'giftcard' as const,
      title: 'Gift Cards',
      description: 'Choose from popular retailers',
      icon: '🎁',
    },
    {
      type: 'statement' as const,
      title: 'Statement Credit',
      description: 'Credit your statement balance',
      icon: '📄',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card pb-8">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Chase Ultimate Rewards</h1>
            <p className="text-muted-foreground">Earn and redeem your rewards points</p>
          </div>
        </div>

        {/* Points Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-600 to-blue-800 text-background">
            <Gift className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-blue-100 text-sm mb-1">Total Points</p>
            <p className="text-4xl font-bold">{points.toLocaleString()}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-600 to-green-800 text-background">
            <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-green-100 text-sm mb-1">This Month</p>
            <p className="text-2xl font-bold">2,450</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-600 to-purple-800 text-background">
            <Zap className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-purple-100 text-sm mb-1">Redeemable Value</p>
            <p className="text-2xl font-bold">${maxRedeemAmount}</p>
          </Card>
        </div>

        {/* Redeem Section */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Redeem Your Points</h2>

          {redeemSuccess && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              Points redeemed successfully!
            </div>
          )}

          {/* Redemption Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {redemptionOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => setRedeemType(option.type)}
                className={`p-4 rounded-lg border-2 transition ${
                  redeemType === option.type
                    ? 'border-blue-600 bg-background'
                    : 'border-border bg-background hover:border-border'
                }`}
              >
                <div className="text-3xl mb-2">{option.icon}</div>
                <h3 className="font-semibold text-foreground text-sm">{option.title}</h3>
                <p className="text-muted-foreground text-xs mt-1">{option.description}</p>
              </button>
            ))}
          </div>

          {/* Redeem Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Amount to Redeem (${})
              </label>
              <input
                type="number"
                value={redeemAmount}
                onChange={(e) => setRedeemAmount(e.target.value)}
                max={maxRedeemAmount}
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter amount"
              />
              <p className="text-muted-foreground text-xs mt-2">
                Maximum redeemable: ${maxRedeemAmount} ({points} points)
              </p>
            </div>

            <button
              onClick={handleRedeem}
              className="w-full px-6 py-3 bg-primary text-background font-medium rounded-lg hover:bg-primary transition"
            >
              Redeem Points
            </button>
          </div>
        </Card>

        {/* Redemption History */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Redemption History</h2>

          {rewardRedemptions.length > 0 ? (
            <div className="space-y-4">
              {rewardRedemptions.map((redemption: any) => (
                <div
                  key={redemption.id}
                  className="flex justify-between items-center p-4 bg-background rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-foreground">{redemption.type}</p>
                    <p className="text-muted-foreground text-sm">
                      {new Date(redemption.date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-semibold text-foreground">
                    {redemption.amount.toLocaleString()} pts
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No redemptions yet</p>
          )}
        </Card>
      </div>
    </div>
  )
}
