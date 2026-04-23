"use client"

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-xl ${className || ""}`} />
}

export function AccountsSkeleton() {
  return (
    <div className="flex flex-col gap-5 pb-24">
      {/* Quick actions row */}
      <div className="flex gap-3 px-1">
        <SkeletonBlock className="h-12 w-12 rounded-full flex-shrink-0" />
        <SkeletonBlock className="h-12 w-28 rounded-full flex-shrink-0" />
        <SkeletonBlock className="h-12 w-24 rounded-full flex-shrink-0" />
        <SkeletonBlock className="h-12 w-20 rounded-full flex-shrink-0" />
      </div>

      {/* Accounts header */}
      <div className="flex items-center justify-between px-1">
        <SkeletonBlock className="h-5 w-24" />
        <SkeletonBlock className="h-5 w-14" />
      </div>

      {/* Total balance card */}
      <SkeletonBlock className="h-24 w-full" />

      {/* Account cards */}
      <SkeletonBlock className="h-40 w-full" />

      {/* Recent transactions */}
      <div className="space-y-3">
        <SkeletonBlock className="h-48 w-full" />
      </div>

      {/* Credit journey */}
      <SkeletonBlock className="h-40 w-full" />
    </div>
  )
}

export function PayTransferSkeleton() {
  return (
    <div className="space-y-6 pb-24">
      {/* Search bar */}
      <SkeletonBlock className="h-12 w-full" />

      {/* Filter */}
      <SkeletonBlock className="h-9 w-36" />

      {/* Quick actions grid */}
      <div className="grid grid-cols-2 gap-3">
        <SkeletonBlock className="h-32" />
        <SkeletonBlock className="h-32" />
        <SkeletonBlock className="h-32" />
        <SkeletonBlock className="h-32" />
      </div>

      {/* Recent activity */}
      <SkeletonBlock className="h-64 w-full" />
    </div>
  )
}

export function PlanTrackSkeleton() {
  return (
    <div className="space-y-6 pb-24">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonBlock className="h-40" />
        <SkeletonBlock className="h-40" />
      </div>

      {/* Goals header */}
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-5 w-32" />
        <SkeletonBlock className="h-8 w-24" />
      </div>

      {/* Goal cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SkeletonBlock className="h-44" />
        <SkeletonBlock className="h-44" />
      </div>

      {/* Spending by category */}
      <SkeletonBlock className="h-5 w-40" />
      <div className="space-y-4">
        <SkeletonBlock className="h-20" />
        <SkeletonBlock className="h-20" />
        <SkeletonBlock className="h-20" />
      </div>
    </div>
  )
}

export function OffersSkeleton() {
  return (
    <div className="pb-24 space-y-6">
      <div>
        <SkeletonBlock className="h-7 w-24 mb-2" />
        <SkeletonBlock className="h-4 w-56 mb-6" />
      </div>

      {/* Points card */}
      <SkeletonBlock className="h-28 w-full" />

      {/* Tabs */}
      <SkeletonBlock className="h-10 w-full mb-4" />

      {/* Offer cards */}
      <div className="space-y-4">
        <SkeletonBlock className="h-44" />
        <SkeletonBlock className="h-44" />
        <SkeletonBlock className="h-44" />
      </div>
    </div>
  )
}

export function MoreSkeleton() {
  return (
    <div className="pb-24 space-y-4">
      {/* Profile section */}
      <div className="flex flex-col items-center gap-3 py-4">
        <SkeletonBlock className="h-20 w-20 rounded-full" />
        <SkeletonBlock className="h-5 w-32" />
        <SkeletonBlock className="h-4 w-44" />
      </div>

      {/* Menu items */}
      <div className="space-y-2">
        <SkeletonBlock className="h-14 w-full" />
        <SkeletonBlock className="h-14 w-full" />
        <SkeletonBlock className="h-14 w-full" />
        <SkeletonBlock className="h-14 w-full" />
        <SkeletonBlock className="h-14 w-full" />
        <SkeletonBlock className="h-14 w-full" />
      </div>
    </div>
  )
}
