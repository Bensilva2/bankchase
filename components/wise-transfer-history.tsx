"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowUpRight, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { toast } from "sonner"

interface Transfer {
  id: string
  wiseId: string
  status: string
  sourceCurrency: string
  targetCurrency: string
  sourceAmount: number
  targetAmount: number
  exchangeRate: number
  feeAmount: number
  recipientName: string
  created_at: string
  funded_at?: string
  completed_at?: string
  error_code?: string
  error_message?: string
}

interface WiseTransferHistoryProps {
  userId: string
  refreshInterval?: number
}

const fetcher = async (url: string) => {
  const res = await axios.get(url)
  return res.data
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
    case "received":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    case "processing":
    case "outgoing_payment_sent":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
    case "pending":
    case "incoming_payment_waiting":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
    case "rejected":
    case "bounced_back":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    case "cancelled":
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
    case "received":
      return <CheckCircle2 className="h-4 w-4" />
    case "processing":
    case "outgoing_payment_sent":
    case "incoming_payment_waiting":
      return <Clock className="h-4 w-4 animate-spin" />
    case "rejected":
    case "bounced_back":
    case "cancelled":
      return <AlertCircle className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

const formatStatus = (status: string) => {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function WiseTransferHistory({ userId, refreshInterval = 5000 }: WiseTransferHistoryProps) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/api/wise/transfers?userId=${userId}&limit=10&offset=0` : null,
    fetcher,
    { refreshInterval, revalidateOnFocus: true }
  )

  const transfers: Transfer[] = data?.transfers || []
  const total = data?.total || 0

  useEffect(() => {
    if (error) {
      console.error("Failed to load transfers:", error)
      toast.error("Failed to load transfer history")
    }
  }, [error])

  if (!userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Please log in to view your transfers</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transfers ({total})</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => mutate()}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Refresh"
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && transfers.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : transfers.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No transfers yet. Create your first transfer above.
          </p>
        ) : (
          <div className="space-y-3">
            {transfers.map((transfer) => (
              <div
                key={transfer.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <ArrowUpRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{transfer.recipientName}</p>
                      <Badge variant="outline" className="text-xs">
                        {transfer.sourceCurrency} → {transfer.targetCurrency}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transfer.created_at).toLocaleDateString()} at{" "}
                      {new Date(transfer.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">
                      {transfer.sourceCurrency} {transfer.sourceAmount.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Gets {transfer.targetCurrency} {transfer.targetAmount.toFixed(2)}
                    </p>
                  </div>

                  <Badge className={`${getStatusColor(transfer.status)} flex items-center gap-1`}>
                    {getStatusIcon(transfer.status)}
                    {formatStatus(transfer.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load transfer history. Please try again.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
