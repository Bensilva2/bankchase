'use client';

export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-24 bg-card rounded-lg animate-pulse"
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-background rounded-lg shadow p-6 space-y-4">
      <div className="h-6 bg-card rounded w-3/4 animate-pulse" />
      <div className="h-4 bg-card rounded w-1/2 animate-pulse" />
      <div className="h-8 bg-card rounded w-1/3 animate-pulse" />
    </div>
  );
}

export function BalanceCardSkeleton() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-background rounded-lg shadow-lg p-8 space-y-4 animate-pulse">
      <div className="h-4 bg-primary rounded w-1/4" />
      <div className="h-12 bg-primary rounded w-1/2" />
    </div>
  );
}
