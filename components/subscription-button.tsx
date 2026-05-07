'use client';

import { useStripe } from '@/hooks/useStripe';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';

interface SubscriptionButtonProps {
  priceId: string;
  planName: string;
  price: number;
  trialDays?: number;
  onSuccess?: (subscription: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function SubscriptionButton({
  priceId,
  planName,
  price,
  trialDays = 0,
  onSuccess,
  onError,
  className = 'w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50',
}: SubscriptionButtonProps) {
  const { startSubscription, loading, error } = useStripe();
  const { user } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setLocalError(null);

    if (!user?.id) {
      setLocalError('Please sign in to subscribe');
      return;
    }

    try {
      // Get or create customer first
      const { getOrCreateCustomer } = await import('@/lib/stripe-utils');
      const customer = await getOrCreateCustomer(user.email, user.id);

      // Create subscription
      const subscription = await startSubscription(
        customer.id,
        priceId,
        trialDays
      );

      onSuccess?.(subscription);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Subscription failed';
      setLocalError(errorMsg);
      onError?.(errorMsg);
    }
  };

  return (
    <>
      <button
        onClick={handleSubscribe}
        disabled={loading || !user}
        className={className}
        aria-busy={loading}
      >
        {loading ? 'Processing...' : `Subscribe to ${planName}`}
      </button>
      {(error || localError) && (
        <p className="text-red-600 text-sm mt-2">{error || localError}</p>
      )}
    </>
  );
}
