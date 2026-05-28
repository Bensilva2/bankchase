'use client'

import { useState } from 'react'
import { Star, TrendingUp, Gift, ChevronRight, Check, Heart } from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navigation } from '@/components/Navigation'
import { toast } from 'sonner'

interface Offer {
  id: string
  title: string
  description: string
  category: string
  discount: number
  cashback: string
  terms: string
  rating: number
  reviews: number
  badge?: string
  featured?: boolean
}

const offers: Offer[] = [
  {
    id: '1',
    title: 'Cashback on Groceries',
    description: 'Earn 3% cashback on all grocery purchases at major retailers',
    category: 'Groceries',
    discount: 3,
    cashback: '3%',
    terms: 'Valid until Dec 31, 2025',
    rating: 4.8,
    reviews: 1240,
    badge: 'Hot',
    featured: true,
  },
  {
    id: '2',
    title: 'Dining Rewards Program',
    description: 'Get 2% cashback on dining and restaurant purchases nationwide',
    category: 'Dining',
    discount: 2,
    cashback: '2%',
    terms: 'Valid until Dec 31, 2025',
    rating: 4.6,
    reviews: 890,
    badge: 'Popular',
  },
  {
    id: '3',
    title: 'Travel Booking Bonus',
    description: 'Earn up to $100 statement credit on flights and hotels',
    category: 'Travel',
    discount: 0,
    cashback: 'Up to $100',
    terms: 'Valid until Mar 31, 2025',
    rating: 4.9,
    reviews: 2150,
    badge: 'Exclusive',
    featured: true,
  },
  {
    id: '4',
    title: 'Gas Station Savings',
    description: '4% cashback at participating gas stations',
    category: 'Gas',
    discount: 4,
    cashback: '4%',
    terms: 'Valid until Dec 31, 2025',
    rating: 4.7,
    reviews: 3420,
  },
  {
    id: '5',
    title: 'Movie Tickets Special',
    description: 'Get $5 off movie tickets when you spend $20 or more',
    category: 'Entertainment',
    discount: 5,
    cashback: '$5 off',
    terms: 'Valid until Feb 28, 2025',
    rating: 4.4,
    reviews: 560,
  },
  {
    id: '6',
    title: 'Online Shopping Bonus',
    description: 'Earn 5% cashback on online purchases from select retailers',
    category: 'Shopping',
    discount: 5,
    cashback: '5%',
    terms: 'Valid until Dec 31, 2025',
    rating: 4.8,
    reviews: 1890,
    featured: true,
  },
]

function MarketplaceContent() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [savedOffers, setSavedOffers] = useState<string[]>([])
  const [claimedOffers, setClaimedOffers] = useState<string[]>([])

  const categories = ['All', 'Groceries', 'Dining', 'Travel', 'Gas', 'Entertainment', 'Shopping']
  
  const filteredOffers = selectedCategory === 'All' 
    ? offers 
    : offers.filter(offer => offer.category === selectedCategory)

  const handleSaveOffer = (id: string) => {
    setSavedOffers(prev => 
      prev.includes(id) ? prev.filter(offerId => offerId !== id) : [...prev, id]
    )
    toast.success(savedOffers.includes(id) ? 'Offer removed from saved' : 'Offer saved!')
  }

  const handleClaimOffer = (id: string, title: string) => {
    setClaimedOffers(prev => [...prev, id])
    toast.success(`${title} activated!`)
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Exclusive Offers & Rewards</h1>
          <p className="text-muted-foreground">Discover special deals curated just for you</p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition flex-shrink-0 ${
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Offers */}
        {selectedCategory === 'All' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Featured Offers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {offers.filter(o => o.featured).map((offer) => (
                <div 
                  key={offer.id} 
                  className="relative bg-gradient-to-br from-primary/20 via-card to-card border-2 border-primary/30 rounded-2xl p-8 overflow-hidden group hover:border-primary/50 transition"
                >
                  {/* Badge */}
                  {offer.badge && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-primary text-white text-xs font-bold rounded-full">
                      {offer.badge}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">{offer.title}</h3>
                      <p className="text-muted-foreground">{offer.description}</p>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-4xl font-bold text-primary">{offer.cashback}</span>
                        <span className="text-muted-foreground">Reward</span>
                      </div>

                      <p className="text-sm text-muted-foreground mb-4">{offer.terms}</p>

                      <div className="flex items-center gap-2 mb-6">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(offer.rating)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {offer.rating} ({offer.reviews.toLocaleString()} reviews)
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleClaimOffer(offer.id, offer.title)}
                          disabled={claimedOffers.includes(offer.id)}
                          className={`flex-1 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                            claimedOffers.includes(offer.id)
                              ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
                              : 'bg-primary hover:bg-primary/90 text-white'
                          }`}
                        >
                          {claimedOffers.includes(offer.id) ? (
                            <>
                              <Check className="w-5 h-5" />
                              Activated
                            </>
                          ) : (
                            <>
                              <Gift className="w-5 h-5" />
                              Activate Offer
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleSaveOffer(offer.id)}
                          className={`px-4 py-3 rounded-lg transition ${
                            savedOffers.includes(offer.id)
                              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                              : 'bg-secondary hover:bg-secondary/80 text-foreground'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${savedOffers.includes(offer.id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Offers */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {selectedCategory === 'All' ? 'More Offers' : selectedCategory}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOffers.map((offer) => (
              <div
                key={offer.id}
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition flex flex-col"
              >
                {/* Badge */}
                {offer.badge && (
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full">
                      {offer.badge}
                    </span>
                  </div>
                )}

                {/* Content */}
                <h3 className="font-bold text-foreground mb-2 flex-1">{offer.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 flex-1">{offer.description}</p>

                {/* Reward Badge */}
                <div className="mb-4 p-4 bg-primary/10 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{offer.cashback}</p>
                  <p className="text-xs text-muted-foreground">Reward</p>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.floor(offer.rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <span>{offer.rating}</span>
                </div>

                {/* Terms */}
                <p className="text-xs text-muted-foreground mb-4">{offer.terms}</p>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-border">
                  <button
                    onClick={() => handleClaimOffer(offer.id, offer.title)}
                    disabled={claimedOffers.includes(offer.id)}
                    className={`flex-1 py-2 rounded-lg font-medium text-sm transition flex items-center justify-center gap-1 ${
                      claimedOffers.includes(offer.id)
                        ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
                        : 'bg-primary/10 hover:bg-primary/20 text-primary'
                    }`}
                  >
                    {claimedOffers.includes(offer.id) ? (
                      <>
                        <Check className="w-4 h-4" />
                        Activated
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4" />
                        Activate
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleSaveOffer(offer.id)}
                    className={`px-3 py-2 rounded-lg transition ${
                      savedOffers.includes(offer.id)
                        ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                        : 'bg-secondary hover:bg-secondary/80 text-foreground'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${savedOffers.includes(offer.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-xl">
          <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">How Offers Work</h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li className="flex gap-2">
              <span>•</span>
              <span>Activate an offer by clicking the button</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Use your Chase card at participating merchants</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Rewards are automatically applied to your account</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>View your rewards in the Analytics section</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}

export default function MarketplacePage() {
  return (
    <ProtectedRoute>
      <Navigation />
      <MarketplaceContent />
    </ProtectedRoute>
  )
}
