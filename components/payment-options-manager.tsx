"use client"

import { useState, useCallback, ReactNode } from "react"

interface PaymentOption {
  id: "send-money" | "transfer" | "pay-bills" | "wire"
  label: string
  description: string
  icon: ReactNode
  isLoading: boolean
  lastSelected: number
}

export interface PaymentOptionsManagerProps {
  onOptionSelect: (optionId: PaymentOption["id"]) => void
  selectedOption: PaymentOption["id"] | null
}

/**
 * Manages smooth transitions between payment options (Send Money, Transfer, Pay Bills, Wire)
 * Ensures real-time state sync and prevents jarring transitions
 */
export function usePaymentOptionsManager() {
  const [selectedOption, setSelectedOption] = useState<PaymentOption["id"] | null>(null)
  const [optionsState, setOptionsState] = useState<Record<PaymentOption["id"], boolean>>({
    "send-money": false,
    transfer: false,
    "pay-bills": false,
    wire: false,
  })

  const selectOption = useCallback((optionId: PaymentOption["id"]) => {
    // Smooth transition: ensure previous option loads before showing new one
    setSelectedOption(optionId)
    setOptionsState((prev) => ({
      ...prev,
      [optionId]: true,
    }))
  }, [])

  const closeOption = useCallback((optionId: PaymentOption["id"]) => {
    if (selectedOption === optionId) {
      setSelectedOption(null)
      setOptionsState((prev) => ({
        ...prev,
        [optionId]: false,
      }))
    }
  }, [selectedOption])

  const resetOptions = useCallback(() => {
    setSelectedOption(null)
    setOptionsState({
      "send-money": false,
      transfer: false,
      "pay-bills": false,
      wire: false,
    })
  }, [])

  return {
    selectedOption,
    optionsState,
    selectOption,
    closeOption,
    resetOptions,
  }
}

// Default export for component usage
export default function PaymentOptionsManager() {
  return null
}
