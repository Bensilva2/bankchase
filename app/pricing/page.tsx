'use client';

import { PaymentButton } from '@/components/payment-button';
import { SubscriptionButton } from '@/components/subscription-button';
import Link from 'next/link';
import { Check } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'Basic',
      price: 0,
      description: 'Perfect for getting started',
      features: [
        'Up to 3 accounts',
        'Basic transfers',
        'Bill pay',
        'Mobile app access',
        'Email support',
      ],
      cta: 'Current Plan',
      popular: false,
    },
    {
      name: 'Premium',
      price: 9.99,
      period: 'month',
      description: 'Most popular for personal use',
      features: [
        'Unlimited accounts',
        'Advanced transfers',
        'Bill pay & scheduling',
        'Investment tools',
        'Priority support',
        'Cashback rewards',
        'Early access to new features',
      ],
      cta: 'Upgrade to Premium',
      priceId: 'price_premium_monthly',
      popular: true,
    },
    {
      name: 'Business',
      price: 29.99,
      period: 'month',
      description: 'For businesses & teams',
      features: [
        'All Premium features',
        'Team accounts',
        'Advanced reporting',
        'API access',
        'Dedicated account manager',
        'Custom integrations',
        '24/7 phone support',
      ],
      cta: 'Contact Sales',
      priceId: 'price_business_monthly',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600 mb-8">
            Choose the perfect plan for your banking needs
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg shadow-lg overflow-hidden transition ${
                plan.popular
                  ? 'ring-2 ring-blue-600 scale-105 bg-white'
                  : 'bg-white'
              }`}
            >
              {plan.popular && (
                <div className="bg-blue-600 text-white text-center py-2 text-sm font-semibold">
                  MOST POPULAR
                </div>
              )}

              <div className="p-8">
                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  {plan.price === 0 ? (
                    <div>
                      <span className="text-4xl font-bold text-gray-900">Free</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-600">/{plan.period}</span>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <div className="mb-8">
                  {plan.priceId ? (
                    <SubscriptionButton
                      priceId={plan.priceId}
                      planName={plan.name}
                      price={plan.price}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                    />
                  ) : plan.name === 'Business' ? (
                    <Link
                      href="mailto:sales@chase.com"
                      className="block text-center w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
                    >
                      {plan.cta}
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-gray-300 text-gray-600 font-semibold py-2 rounded-lg cursor-not-allowed"
                    >
                      {plan.cta}
                    </button>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-4">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I change plans anytime?</h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
              <p className="text-gray-600">
                Yes, Premium plan includes a 7-day free trial. No credit card required to start.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards (Visa, Mastercard, American Express) through Stripe.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What if I want to cancel?</h3>
              <p className="text-gray-600">
                You can cancel anytime from your account settings. No cancellation fees or long-term contracts.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Do you offer discounts for annual billing?</h3>
              <p className="text-gray-600">
                Yes! Pay annually and save 20% on Premium plan. Contact sales for Business plan discounts.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Have questions? Contact our sales team at{' '}
            <a href="mailto:sales@chase.com" className="text-blue-600 hover:underline">
              sales@chase.com
            </a>
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
