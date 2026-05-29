'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, TrendingUp, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface DemoTransferNotificationProps {
  unreadCount?: number;
  latestTransfer?: {
    reference: string;
    amount: number;
    type: 'internal' | 'external';
  };
  onDismiss?: () => void;
}

export function DemoTransferNotification({
  unreadCount = 0,
  latestTransfer,
  onDismiss,
}: DemoTransferNotificationProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!latestTransfer || unreadCount === 0 || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 p-4 mb-6">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 opacity-10">
        <Gift className="h-24 w-24 text-blue-600" />
      </div>

      <div className="relative flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              Demo Money Received!
            </p>
            <p className="text-sm text-gray-600 mt-1">
              You received ${latestTransfer.amount.toLocaleString()} in demo money
              {latestTransfer.type === 'external' ? ' (pending refund)' : ''}
            </p>
            {unreadCount > 1 && (
              <p className="text-xs text-blue-600 mt-2 font-medium">
                +{unreadCount - 1} more transfer{unreadCount - 1 !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/demo-transfers">
            <Button variant="outline" size="sm" className="gap-2">
              View All
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </Card>
  );
}
