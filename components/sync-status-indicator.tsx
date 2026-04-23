"use client"

import { useBanking } from "@/lib/banking-context"
import { Cloud, CloudOff, RefreshCw, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SyncStatusIndicator() {
  const { isOnline, isSyncing, lastSynced, manualSync } = useBanking()

  const formatLastSynced = (date: string | null) => {
    if (!date) return "Never"
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()

    if (diff < 60000) return "Just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return d.toLocaleDateString()
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      {isOnline ? (
        <div className="flex items-center gap-1 text-green-600">
          <Cloud className="h-3 w-3" />
          <span>Online</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-amber-600">
          <CloudOff className="h-3 w-3" />
          <span>Offline</span>
        </div>
      )}

      <span className="text-muted-foreground">•</span>

      {isSyncing ? (
        <div className="flex items-center gap-1 text-blue-600">
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>Syncing...</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Check className="h-3 w-3" />
          <span>Synced {formatLastSynced(lastSynced)}</span>
        </div>
      )}

      {isOnline && !isSyncing && (
        <Button variant="ghost" size="sm" className="h-5 px-1" onClick={() => manualSync()}>
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
