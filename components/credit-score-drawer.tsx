"use client"

import { useState, useEffect } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useBanking } from "@/lib/banking-context"
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  RefreshCw,
  ChevronRight,
  Shield,
  CreditCard,
  Clock,
  Percent,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CreditScoreDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreditScoreDrawer({ open, onOpenChange }: CreditScoreDrawerProps) {
  const { userProfile, transactions, creditCards, addNotification } = useBanking()
  const { toast } = useToast()
  const [creditScore, setCreditScore] = useState(645)
  const [previousScore, setPreviousScore] = useState(640)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [scoreHistory, setScoreHistory] = useState<{ date: string; score: number }[]>([])

  useEffect(() => {
    // Load credit score data from localStorage
    const savedData = localStorage.getItem("chase_credit_score")
    if (savedData) {
      const data = JSON.parse(savedData)
      setCreditScore(data.score)
      setPreviousScore(data.previousScore || data.score - 5)
      setLastUpdated(new Date(data.updatedAt))
      setScoreHistory(data.history || [])
    } else {
      // Initialize with default data
      const initialHistory = [
        { date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), score: 630 },
        { date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), score: 635 },
        { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), score: 640 },
        { date: new Date().toISOString(), score: 645 },
      ]
      setScoreHistory(initialHistory)
      saveCreditData(645, 640, initialHistory)
    }
  }, [])

  const saveCreditData = (score: number, prevScore: number, history: { date: string; score: number }[]) => {
    localStorage.setItem(
      "chase_credit_score",
      JSON.stringify({
        score,
        previousScore: prevScore,
        updatedAt: new Date().toISOString(),
        history,
      }),
    )
  }

  const handleRefresh = () => {
    setIsRefreshing(true)

    // Simulate credit score check with slight variation
    setTimeout(() => {
      const variation = Math.floor(Math.random() * 11) - 5 // -5 to +5
      const newScore = Math.max(300, Math.min(850, creditScore + variation))
      const newHistory = [...scoreHistory, { date: new Date().toISOString(), score: newScore }].slice(-12)

      setPreviousScore(creditScore)
      setCreditScore(newScore)
      setLastUpdated(new Date())
      setScoreHistory(newHistory)
      setIsRefreshing(false)

      saveCreditData(newScore, creditScore, newHistory)

      const changeText = newScore > creditScore ? "increased" : newScore < creditScore ? "decreased" : "stayed the same"

      toast({
        title: "Credit Score Updated",
        description: `Your score has ${changeText} to ${newScore}`,
      })

      addNotification({
        title: "Credit Score Update",
        message: `Your VantageScore 3.0 credit score is now ${newScore}`,
        type: newScore >= creditScore ? "success" : "warning",
        category: "Credit",
      })
    }, 2000)
  }

  // Calculate factors based on user activity
  const calculateFactors = () => {
    const factors = []

    // Payment history (based on completed transactions)
    const completedPayments = transactions.filter((t) => t.status === "completed").length
    const totalPayments = transactions.length
    const paymentRatio = totalPayments > 0 ? completedPayments / totalPayments : 1

    factors.push({
      name: "Payment History",
      status: paymentRatio >= 0.95 ? "good" : paymentRatio >= 0.8 ? "fair" : "poor",
      icon: CheckCircle,
      description: paymentRatio >= 0.95 ? "Excellent payment record" : "Some late or missed payments",
      impact: "High Impact",
    })

    // Credit utilization (based on credit card)
    const card = creditCards[0]
    const utilization = card ? (card.balance / card.creditLimit) * 100 : 30

    factors.push({
      name: "Credit Utilization",
      status: utilization <= 30 ? "good" : utilization <= 50 ? "fair" : "poor",
      icon: Percent,
      description: `${utilization.toFixed(0)}% of available credit used`,
      impact: "High Impact",
    })

    // Length of credit history
    factors.push({
      name: "Credit Age",
      status: "good",
      icon: Clock,
      description: "Average account age: 5 years",
      impact: "Medium Impact",
    })

    // Credit mix
    factors.push({
      name: "Credit Mix",
      status: "fair",
      icon: CreditCard,
      description: "Mix of credit types",
      impact: "Low Impact",
    })

    // Recent inquiries
    factors.push({
      name: "New Credit",
      status: "good",
      icon: Shield,
      description: "No recent hard inquiries",
      impact: "Low Impact",
    })

    return factors
  }

  const factors = calculateFactors()
  const scoreChange = creditScore - previousScore
  const progressPercentage = ((creditScore - 300) / (850 - 300)) * 100

  const getScoreCategory = (score: number) => {
    if (score >= 800) return { label: "Excellent", color: "text-green-600" }
    if (score >= 740) return { label: "Very Good", color: "text-green-500" }
    if (score >= 670) return { label: "Good", color: "text-blue-500" }
    if (score >= 580) return { label: "Fair", color: "text-yellow-500" }
    return { label: "Poor", color: "text-red-500" }
  }

  const category = getScoreCategory(creditScore)

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[95vh]">
        <DrawerHeader className="border-b">
          <DrawerTitle>Credit Journey</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-4 overflow-auto flex-1">
          {/* Main Score Card */}
          <Card className="p-6 text-center bg-gradient-to-br from-[#0a4fa6] to-[#117aca] text-white">
            <p className="text-sm text-white/80 mb-2">VantageScore® 3.0</p>
            <div className="relative inline-block">
              <p className="text-6xl font-bold mb-2">{creditScore}</p>
              {scoreChange !== 0 && (
                <div
                  className={`absolute -right-12 top-2 flex items-center gap-1 text-sm ${scoreChange > 0 ? "text-green-300" : "text-red-300"}`}
                >
                  {scoreChange > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {Math.abs(scoreChange)}
                </div>
              )}
            </div>
            <p className={`text-lg font-medium ${category.color} bg-white/20 rounded-full px-4 py-1 inline-block`}>
              {category.label}
            </p>
            <p className="text-sm text-white/70 mt-3">
              Updated {lastUpdated.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </Card>

          {/* Refresh Button */}
          <Button onClick={handleRefresh} disabled={isRefreshing} className="w-full bg-[#0a4fa6] hover:bg-[#083d82]">
            {isRefreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Checking your score...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Credit Score
              </>
            )}
          </Button>

          {/* Score Range */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Score Range</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-red-500">Poor</span>
                <span className="text-yellow-500">Fair</span>
                <span className="text-blue-500">Good</span>
                <span className="text-green-500">Excellent</span>
              </div>
              <div className="relative">
                <Progress value={progressPercentage} className="h-3" />
                <div
                  className="absolute top-0 h-3 w-1 bg-white border border-gray-400 rounded"
                  style={{ left: `${progressPercentage}%`, transform: "translateX(-50%)" }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>300</span>
                <span>580</span>
                <span>670</span>
                <span>740</span>
                <span>850</span>
              </div>
            </div>
          </Card>

          {/* Score History */}
          {scoreHistory.length > 1 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Score History</h3>
              <div className="flex items-end justify-between h-24 gap-1">
                {scoreHistory.slice(-6).map((item, index) => {
                  const height = ((item.score - 300) / (850 - 300)) * 100
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-medium">{item.score}</span>
                      <div
                        className="w-full bg-[#0a4fa6] rounded-t transition-all duration-300"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.date).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Factors */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Factors Affecting Your Score</h3>
            <div className="space-y-3">
              {factors.map((factor, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div
                    className={`p-2 rounded-full ${
                      factor.status === "good"
                        ? "bg-green-100"
                        : factor.status === "fair"
                          ? "bg-yellow-100"
                          : "bg-red-100"
                    }`}
                  >
                    <factor.icon
                      className={`h-4 w-4 ${
                        factor.status === "good"
                          ? "text-green-600"
                          : factor.status === "fair"
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{factor.name}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          factor.status === "good"
                            ? "bg-green-100 text-green-700"
                            : factor.status === "fair"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {factor.status.charAt(0).toUpperCase() + factor.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{factor.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{factor.impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Tips */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Tips to Improve Your Score</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <span className="text-sm">Pay bills on time</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <span className="text-sm">Keep credit utilization below 30%</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <span className="text-sm">Don't close old accounts</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <span className="text-sm">Limit hard inquiries</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </Card>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center px-4">
            Your VantageScore 3.0 is based on data from TransUnion. Scores may vary when accessed from other sources.
            This score is for educational purposes and may differ from scores used by lenders.
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
