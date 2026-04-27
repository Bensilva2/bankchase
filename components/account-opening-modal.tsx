'use client'

import { useState } from 'react'
import { X, Building2, Shield, CreditCard, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useBanking } from '@/lib/banking-context'

interface AccountOpeningModalProps {
  isOpen: boolean
  onClose: () => void
}

type AccountType = 'checking' | 'savings' | 'credit' | 'investment'

export function AccountOpeningModal({ isOpen, onClose }: AccountOpeningModalProps) {
  const [step, setStep] = useState<'type' | 'details' | 'confirm'>('type')
  const [selectedType, setSelectedType] = useState<AccountType>('checking')
  const { toast } = useToast()
  const { accounts, addAccount } = useBanking()

  if (!isOpen) return null

  const accountTypes = [
    {
      id: 'checking',
      name: 'Checking Account',
      description: 'Chase Total Checking - No monthly service fee with qualifying activity',
      icon: Building2,
      color: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      id: 'savings',
      name: 'Savings Account',
      description: 'Chase Savings - Earn interest on your balance',
      icon: Shield,
      color: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      id: 'credit',
      name: 'Credit Card',
      description: 'Choose from multiple Chase credit cards with rewards',
      icon: CreditCard,
      color: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      id: 'investment',
      name: 'Investment Account',
      description: 'Self-directed investing with You Invest Trade',
      icon: TrendingUp,
      color: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
  ]

  const handleOpenAccount = async () => {
    try {
      // Simulate account opening process
      const newAccount = {
        type: selectedType,
        openedAt: new Date().toISOString(),
        status: 'pending',
      }

      // In a real scenario, this would call an API
      // For now, we'll just show a success message
      toast({
        title: 'Account Opening Initiated',
        description: `Your ${accountTypes.find(a => a.id === selectedType)?.name} application has been submitted. We'll review it shortly.`,
      })

      setStep('type')
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to open account. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Open a New Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'type' && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-6">Choose the type of account you'd like to open.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accountTypes.map((type) => {
                  const IconComponent = type.icon
                  return (
                    <button
                      key={type.id}
                      onClick={() => {
                        setSelectedType(type.id as AccountType)
                        setStep('details')
                      }}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        selectedType === type.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-400'
                      }`}
                    >
                      <div className={`w-12 h-12 ${type.color} rounded-full flex items-center justify-center mb-4`}>
                        <IconComponent className={`w-6 h-6 ${type.iconColor}`} />
                      </div>
                      <p className="font-semibold text-gray-900">{type.name}</p>
                      <p className="text-sm text-gray-500 mt-2">{type.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {accountTypes.find(a => a.id === selectedType)?.name}
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700">
                    {selectedType === 'checking' && (
                      <>
                        <strong>Requirements:</strong>
                        <ul className="list-disc list-inside mt-2">
                          <li>Minimum deposit: $0</li>
                          <li>Valid ID required</li>
                          <li>Social Security Number</li>
                        </ul>
                      </>
                    )}
                    {selectedType === 'savings' && (
                      <>
                        <strong>Benefits:</strong>
                        <ul className="list-disc list-inside mt-2">
                          <li>Competitive interest rates</li>
                          <li>FDIC insured</li>
                          <li>Access your funds anytime</li>
                        </ul>
                      </>
                    )}
                    {selectedType === 'credit' && (
                      <>
                        <strong>Available Cards:</strong>
                        <ul className="list-disc list-inside mt-2">
                          <li>Chase Freedom Unlimited</li>
                          <li>Chase Sapphire Preferred</li>
                          <li>Chase Ink Business</li>
                        </ul>
                      </>
                    )}
                    {selectedType === 'investment' && (
                      <>
                        <strong>Features:</strong>
                        <ul className="list-disc list-inside mt-2">
                          <li>Low trading commissions</li>
                          <li>Research tools & analysis</li>
                          <li>Mobile trading app</li>
                        </ul>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800">
                  <strong>Almost done!</strong> Review the information and click submit to complete your application.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={() => {
              if (step === 'details') setStep('type')
              else if (step === 'confirm') setStep('details')
              else onClose()
            }}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {step === 'type' ? 'Cancel' : 'Back'}
          </button>
          <Button
            onClick={() => {
              if (step === 'type') setStep('details')
              else if (step === 'details') setStep('confirm')
              else handleOpenAccount()
            }}
            className="px-6 py-2"
          >
            {step === 'confirm' ? 'Submit Application' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  )
}
