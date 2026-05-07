'use client';

import { useStripe } from '@/hooks/useStripe';
import { CheckoutItem } from '@/lib/stripe-utils';
import { useState } from 'react';

interface PaymentButtonProps {
  items: CheckoutItem[];
  customerEmail?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function PaymentButton({
  items,
  customerEmail,
  onSuccess,
  onError,
  className = 'w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50',
  children = 'Pay Now',
}: PaymentButtonProps) {
  const { startCheckout, loading, error } = useStripe();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleClick = async () => {
    setLocalError(null);
    try {
      await startCheckout(items, { customerEmail });
      onSuccess?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Payment failed';
      setLocalError(errorMsg);
      onError?.(errorMsg);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={className}
        aria-busy={loading}
      >
        {loading ? 'Processing...' : children}
      </button>
      {(error || localError) && (
        <p className="text-red-600 text-sm mt-2">{error || localError}</p>
      )}
    </>
  );
}
