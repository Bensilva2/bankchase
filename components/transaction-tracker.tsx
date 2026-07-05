"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, Circle, Clock, AlertCircle, ArrowRight, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface TransactionStep {
  step: string
  status: "pending" | "in_progress" | "completed" | "failed"
  timestamp?: Date
  details?: string
}

interface TransactionTrackerProps {
  transactionId: string
  amount: number
  currency?: string
  recipient: string
  paymentRail: string
  steps: TransactionStep[]
  estimatedCompletion?: string
  onRefresh?: () => void
}

export function TransactionTracker({
  transactionId,
  amount,
  currency = "USD",
  recipient,
  paymentRail,
  steps: initialSteps,
  estimatedCompletion,
  onRefresh,
}: TransactionTrackerProps) {
  const [steps, setSteps] = useState<TransactionStep[]>(initialSteps)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSteps((current) => {
        const newSteps = [...current]
        const inProgressIndex = newSteps.findIndex((s) => s.status === "in_progress")
        
        if (inProgressIndex !== -1 && inProgressIndex < newSteps.length - 1) {
          // Complete current step
          newSteps[inProgressIndex] = {
            ...newSteps[inProgressIndex],
            status: "completed",
            timestamp: new Date(),
          }
          // Start next step
          if (inProgressIndex + 1 < newSteps.length) {
            newSteps[inProgressIndex + 1] = {
              ...newSteps[inProgressIndex + 1],
              status: "in_progress",
            }
          }
        }
        return newSteps
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const completedSteps = steps.filter((s) => s.status === "completed").length
  const progress = (completedSteps / steps.length) * 100
  const isComplete = completedSteps === steps.length

  const handleRefresh = async () => {
    setIsRefreshing(true)
    onRefresh?.()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const getStatusIcon = (status: TransactionStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusBadge = () => {
    if (isComplete) {
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Completed</Badge>
    }
    const inProgress = steps.find((s) => s.status === "in_progress")
    if (inProgress) {
      return <Badge className="bg-primary/10 text-blue-600 border-blue-500/20">Processing</Badge>
    }
    return <Badge variant="outline">Pending</Badge>
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Transaction Tracking</CardTitle>
            <CardDescription className="font-mono text-xs mt-1">{transactionId}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transfer Summary */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold">
              {currency === "USD" ? "$" : currency} {amount.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Amount</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium">{recipient}</p>
            <p className="text-xs text-muted-foreground">Recipient</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          {estimatedCompletion && !isComplete && (
            <p className="text-xs text-muted-foreground">
              Estimated completion: {estimatedCompletion}
            </p>
          )}
        </div>

        {/* Steps Timeline */}
        <div className="space-y-1">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3 py-2">
              <div className="flex flex-col items-center">
                {getStatusIcon(step.status)}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-0.5 h-8 mt-1",
                      step.status === "completed" ? "bg-green-500" : "bg-muted"
                    )}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-medium text-sm",
                    step.status === "completed" && "text-green-600",
                    step.status === "in_progress" && "text-blue-600",
                    step.status === "pending" && "text-muted-foreground"
                  )}
                >
                  {step.step}
                </p>
                {step.details && (
                  <p className="text-xs text-muted-foreground">{step.details}</p>
                )}
                {step.timestamp && (
                  <p className="text-xs text-muted-foreground">
                    {step.timestamp.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Payment Rail Info */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Payment Network</span>
            <Badge variant="outline">{paymentRail}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
