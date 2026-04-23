'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertCircle,
  Zap,
  Clock,
  DollarSign,
  Globe,
  Repeat2,
  ArrowRightLeft,
  Info,
} from 'lucide-react'
import { wireOptionsService, WireOption } from '@/lib/wire-options-service'

interface WireOptionsSelectorProps {
  amount: number
  onSelectOption: (optionId: string) => void
  selectedOption?: string
  wiretype?: 'domestic' | 'international'
  showRecommendations?: boolean
}

export function WireOptionsSelector({
  amount,
  onSelectOption,
  selectedOption,
  wiretype = 'domestic',
  showRecommendations = true,
}: WireOptionsSelectorProps) {
  const [speedPreference, setSpeedPreference] = useState<'standard' | 'fast' | 'urgent'>('standard')

  const allOptions = useMemo(() => {
    return wireOptionsService.getOptionsByCategory()
  }, [])

  const availableOptions = useMemo(() => {
    if (wiretype === 'international') {
      return allOptions.international.filter((opt) =>
        wireOptionsService.isOptionAvailable(opt.id, amount)
      )
    }
    return allOptions.domestic.filter((opt) =>
      wireOptionsService.isOptionAvailable(opt.id, amount)
    )
  }, [amount, wiretype, allOptions])

  const recommendedOption = useMemo(() => {
    if (showRecommendations && availableOptions.length > 0) {
      return wireOptionsService.getRecommendedOption(amount, speedPreference)
    }
    return undefined
  }, [amount, speedPreference, availableOptions, showRecommendations])

  const specialOptions = useMemo(() => {
    return allOptions.special.filter((opt) => wireOptionsService.isOptionAvailable(opt.id, amount))
  }, [amount, allOptions])

  const getOptionIcon = (optionId: string) => {
    if (optionId.includes('urgent')) return <Zap className="w-5 h-5 text-orange-500" />
    if (optionId.includes('priority')) return <Clock className="w-5 h-5 text-blue-500" />
    if (optionId.includes('recurring')) return <Repeat2 className="w-5 h-5 text-purple-500" />
    if (optionId.includes('own-account')) return <ArrowRightLeft className="w-5 h-5 text-green-500" />
    if (optionId.includes('international')) return <Globe className="w-5 h-5 text-indigo-500" />
    return <DollarSign className="w-5 h-5 text-gray-500" />
  }

  const renderWireOption = (option: WireOption) => {
    const fee = wireOptionsService.getFee(option.id)
    const totalCost = amount + fee
    const isRecommended = recommendedOption?.id === option.id
    const isSelected = selectedOption === option.id

    return (
      <Card
        key={option.id}
        className={`p-4 cursor-pointer transition-all border-2 relative
          ${
            isSelected
              ? 'border-blue-500 bg-blue-50/50'
              : isRecommended
                ? 'border-green-200 bg-green-50/30'
                : 'border-gray-200 hover:border-gray-300'
          }`}
        onClick={() => onSelectOption(option.id)}
      >
        {isRecommended && (
          <Badge className="absolute top-2 right-2 bg-green-500">Recommended</Badge>
        )}

        <div className="flex items-start gap-3 mb-3">
          {getOptionIcon(option.id)}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{option.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{option.description}</p>
          </div>
          <RadioGroupItem value={option.id} id={option.id} />
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t">
          <div className="text-center">
            <div className="text-xs text-gray-500">Fee</div>
            <div className="font-semibold text-gray-900">${fee.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Processing</div>
            <div className="font-semibold text-gray-900 text-sm">{option.processingTime}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Total</div>
            <div className="font-semibold text-gray-900">${totalCost.toFixed(2)}</div>
          </div>
        </div>

        {option.requiresVerification && (
          <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 bg-amber-50 p-2 rounded">
            <AlertCircle className="w-3 h-3" />
            Requires verification
          </div>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Speed Preference Selector */}
      {showRecommendations && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <Label className="text-sm font-semibold text-gray-900 mb-3 block">
            How urgent is your transfer?
          </Label>
          <div className="flex gap-2">
            {(['standard', 'fast', 'urgent'] as const).map((pref) => (
              <Button
                key={pref}
                variant={speedPreference === pref ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSpeedPreference(pref)}
                className="capitalize"
              >
                {pref === 'standard' && 'Standard'}
                {pref === 'fast' && 'Fast'}
                {pref === 'urgent' && 'Urgent'}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Main Wire Options */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold text-gray-900">
            {wiretype === 'international' ? 'International Wire Options' : 'Domestic Wire Options'}
          </h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {availableOptions.length} available
          </span>
        </div>

        {availableOptions.length === 0 ? (
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900">No Options Available</h4>
                <p className="text-sm text-red-700 mt-1">
                  The amount ${amount.toFixed(2)} exceeds the limits for available wire options.
                  Please enter a different amount.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <RadioGroup value={selectedOption || ''} onValueChange={onSelectOption}>
            <div className="space-y-3">{availableOptions.map((option) => renderWireOption(option))}</div>
          </RadioGroup>
        )}
      </div>

      {/* Special Options */}
      {specialOptions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-semibold text-gray-900">Special Options</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {specialOptions.length} available
            </span>
          </div>

          <RadioGroup value={selectedOption || ''} onValueChange={onSelectOption}>
            <div className="space-y-3">{specialOptions.map((option) => renderWireOption(option))}</div>
          </RadioGroup>
        </div>
      )}

      {/* Info Box */}
      {selectedOption && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex gap-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Transfer Information</p>
              {(() => {
                const selected = wireOptionsService.getOption(selectedOption)
                const deliveryDate = wireOptionsService.getEstimatedDeliveryDate(selectedOption)
                if (!selected) return null
                return (
                  <ul className="space-y-1 text-xs">
                    <li>
                      <strong>Estimated Delivery:</strong> {deliveryDate.toLocaleDateString()}
                    </li>
                    <li>
                      <strong>Processing Time:</strong> {selected.processingTime}
                    </li>
                    <li>
                      <strong>Fee:</strong> ${selected.fee.toFixed(2)}
                    </li>
                    <li>
                      <strong>Max Daily:</strong> ${selected.limits.daily.toLocaleString()}
                    </li>
                  </ul>
                )
              })()}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
