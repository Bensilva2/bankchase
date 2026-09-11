"use client"

import { useCallback, useState } from "react"
import { CheckCircle2, Clock3, ExternalLink, IdCard, Loader2, RefreshCw, ShieldCheck, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useBanking } from "@/lib/banking-context"

type KycStatus = "not_started" | "awaiting_documents" | "needs_information" | "requires_verification" | "pending" | "approved" | "rejected"

type KycResponse = {
  success?: boolean
  status?: KycStatus
  iframe_url?: string | null
  reason?: string
  error?: string
}

const statusCopy: Record<KycStatus, { label: string; description: string }> = {
  not_started: { label: "Not started", description: "Complete identity verification before issuing a new card." },
  awaiting_documents: { label: "Documents needed", description: "Upload a government ID to continue your verification." },
  needs_information: { label: "More information needed", description: "A few additional details are required to finish the review." },
  requires_verification: { label: "Face scan needed", description: "Complete a short face scan to confirm your identity." },
  pending: { label: "Under review", description: "Your identity is being reviewed. We will update you when it is complete." },
  approved: { label: "Verified", description: "Your identity is confirmed and you can issue cards." },
  rejected: { label: "Unable to verify", description: "We could not verify your identity. You can review the reason and try again." },
}

export function KycVerificationCard() {
  const { userProfile } = useBanking()
  const [status, setStatus] = useState<KycStatus>("not_started")
  const [iframeUrl, setIframeUrl] = useState<string | null>(null)
  const [reason, setReason] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const userId = userProfile.id || "user1"

  const readStatus = useCallback(async () => {
    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch(`/api/kyc?userId=${encodeURIComponent(userId)}`, { cache: "no-store" })
      const data = (await response.json()) as KycResponse
      if (!response.ok && response.status !== 404) throw new Error(data.error || "Unable to read verification status")
      setStatus(data.status || "not_started")
      setIframeUrl(data.iframe_url || null)
      setReason(data.reason || null)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to read verification status")
    } finally {
      setLoading(false)
    }
  }, [userId])

  const startVerification = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", userId }),
      })
      const data = (await response.json()) as KycResponse
      if (!response.ok) throw new Error(data.error || "Unable to start verification")
      setStatus(data.status || "requires_verification")
      setIframeUrl(data.iframe_url || null)
      setReason(data.reason || null)
      if (!data.iframe_url) setMessage("Hosted verification is ready to connect. Add your Agentcard KYC URL to open the secure flow.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start verification")
    } finally {
      setLoading(false)
    }
  }

  const copy = statusCopy[status]
  const actionable = status === "awaiting_documents" || status === "needs_information" || status === "requires_verification"

  return (
    <Card className="overflow-hidden border-primary/15 bg-card shadow-sm">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary" aria-hidden="true"><ShieldCheck className="h-5 w-5" /></div>
          <div>
            <CardTitle className="text-base">Identity verification</CardTitle>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Required once before your first issued card.</p>
          </div>
        </div>
        <Badge variant={status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary"}>{copy.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <p className="text-sm leading-relaxed text-muted-foreground">{copy.description}</p>
        {status === "approved" ? (
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4" />Ready for card issuing</div>
        ) : status === "pending" ? (
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Clock3 className="h-4 w-4" />No action needed right now</div>
        ) : status === "rejected" ? (
          <div className="space-y-3"><div className="flex items-start gap-2 text-sm text-destructive"><XCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{reason || "Please review your information and try again."}</span></div><Button onClick={startVerification} disabled={loading} variant="outline">Try again</Button></div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button onClick={iframeUrl ? () => window.open(iframeUrl, "_blank", "noopener,noreferrer") : startVerification} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : iframeUrl ? <ExternalLink className="mr-2 h-4 w-4" /> : <IdCard className="mr-2 h-4 w-4" />}
              {actionable && iframeUrl ? "Continue verification" : "Start verification"}
            </Button>
            <Button onClick={readStatus} disabled={loading} variant="ghost" size="icon" aria-label="Refresh verification status"><RefreshCw className="h-4 w-4" /></Button>
          </div>
        )}
        {message && <p className="text-xs leading-relaxed text-muted-foreground" role="status">{message}</p>}
      </CardContent>
    </Card>
  )
}
