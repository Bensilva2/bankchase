"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useBanking } from "@/lib/banking-context"

interface CreditJourneyCardProps {
  onViewScore: () => void
}

export function CreditJourneyCard({ onViewScore }: CreditJourneyCardProps) {
  const { userProfile } = useBanking()
  const [creditScore, setCreditScore] = useState(645)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    // Load credit score from localStorage if available
    const savedScore = localStorage.getItem("chase_credit_score")
    if (savedScore) {
      const data = JSON.parse(savedScore)
      setCreditScore(data.score)
      setLastUpdated(new Date(data.updatedAt))
    }
  }, [])

  // Calculate progress percentage (300-850 range)
  const progressPercentage = ((creditScore - 300) / (850 - 300)) * 100

  return (
    <Card className="bg-gradient-to-r from-[#0060A9] to-[#117ACA] text-white border-none p-6 shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold mb-2">Credit Journey</h3>
          <p className="text-lg mb-1 font-medium">Get your latest credit score</p>
          <p className="text-sm opacity-90 mb-6 text-blue-100">
            Last credit score: {creditScore} as of {lastUpdated.toLocaleDateString()}
            <br />
            by VantageScore® 3.0
          </p>
        </div>
        <div className="relative h-16 w-16 flex items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="4"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeDasharray={`${progressPercentage}, 100`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-[#0060A9] font-bold text-sm">{creditScore}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end">
        <Button
          variant="secondary"
          onClick={onViewScore}
          className="bg-white text-[#0060A9] hover:bg-blue-50 font-semibold rounded-full px-6 transition-transform duration-150 active:scale-95"
        >
          See latest score
        </Button>
      </div>
    </Card>
  )
}
