'use client'

export default function OffersPage() {
  const offers = [
    {
      id: '1',
      title: 'Earn 5% APY',
      subtitle: 'High-Yield Savings Account',
      description: 'Get 5% annual percentage yield on your savings',
      icon: '💰',
      badge: 'Limited Time',
      cta: 'Open Account',
    },
    {
      id: '2',
      title: 'No Annual Fee Credit Card',
      subtitle: 'Chase Freedom Unlimited',
      description: 'Earn 1.5% cash back on all purchases',
      icon: '💳',
      badge: 'Popular',
      cta: 'Apply Now',
    },
    {
      id: '3',
      title: 'Cashback Bonus',
      subtitle: '$200 Welcome Bonus',
      description: 'Get $200 cash back when you spend $500 in first 3 months',
      icon: '💵',
      badge: 'New',
      cta: 'Learn More',
    },
    {
      id: '4',
      title: 'Investment Account',
      subtitle: 'Chase Invest',
      description: 'Start investing with as little as $1',
      icon: '📈',
      badge: 'Featured',
      cta: 'Get Started',
    },
    {
      id: '5',
      title: 'Mortgage Rates',
      subtitle: 'Special Rates for Qualified Members',
      description: 'Get personalized mortgage rates and terms',
      icon: '🏡',
      badge: 'Special',
      cta: 'Check Rates',
    },
    {
      id: '6',
      title: 'Auto Loan Program',
      subtitle: 'Competitive Rates',
      description: 'Drive home with our competitive auto loan rates',
      icon: '🚗',
      badge: 'Offer',
      cta: 'Apply',
    },
  ]

  const badgeColors: Record<string, string> = {
    'Limited Time': 'bg-red-100 text-red-700',
    'Popular': 'bg-card text-blue-700',
    'New': 'bg-green-100 text-green-700',
    'Featured': 'bg-purple-100 text-purple-700',
    'Special': 'bg-yellow-100 text-yellow-700',
    'Offer': 'bg-pink-100 text-pink-700',
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 md:pb-0">
      <div className="mb-10">
        <h1 className="text-4xl font-bold">Offers & Deals</h1>
        <p className="text-muted-foreground mt-2">Exclusive offers tailored just for you</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map((offer) => (
          <div key={offer.id} className="bg-background rounded-3xl shadow hover:shadow-lg transition-all p-8">
            <div className="flex items-start justify-between mb-4">
              <span className="text-5xl">{offer.icon}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColors[offer.badge] || 'bg-background text-foreground'}`}>
                {offer.badge}
              </span>
            </div>

            <h3 className="text-xl font-bold mb-1">{offer.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{offer.subtitle}</p>
            <p className="text-sm text-muted-foreground mb-6">{offer.description}</p>

            <button className="w-full bg-primary text-white py-3 rounded-2xl font-semibold hover:bg-primary transition">
              {offer.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Banner Section */}
      <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-3xl shadow p-12 text-center">
        <h2 className="text-3xl font-bold mb-3">Refer Friends & Earn Rewards</h2>
        <p className="text-blue-100 mb-6">Get $100 for every friend that opens an account. No limit!</p>
        <button className="bg-background text-blue-600 px-8 py-3 rounded-2xl font-semibold hover:bg-background transition">
          Share Your Code
        </button>
      </div>
    </div>
  )
}
