'use client';

import React, { useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Plus } from 'lucide-react';

interface PlaidLinkButtonProps {
  onSuccess?: (metadata: any) => void;
  onError?: (error: any) => void;
  userId?: string;
}

export function PlaidLinkButton({ onSuccess, onError, userId }: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch link token on component mount
  useEffect(() => {
    const fetchLinkToken = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/plaid/create-link-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to create link token');
        }

        const data = await response.json();
        setLinkToken(data.linkToken);
      } catch (err: any) {
        console.error('[v0] Error fetching link token:', err);
        setError(err.message || 'Failed to initialize Plaid Link');
      } finally {
        setLoading(false);
      }
    };

    fetchLinkToken();
  }, []);

  // Handle successful token exchange
  const handlePlaidSuccess = async (public_token: string, metadata: any) => {
    try {
      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          publicToken: public_token,
          metadata,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange token');
      }

      const result = await response.json();
      onSuccess?.(result);
    } catch (err: any) {
      console.error('[v0] Error exchanging token:', err);
      onError?.(err);
    }
  };

  // Handle Plaid Link errors
  const handlePlaidError = (error: any) => {
    console.error('[v0] Plaid Link error:', error);
    setError(error.error_message || 'An error occurred with Plaid Link');
    onError?.(error);
  };

  // Initialize Plaid Link
  const { open, ready } = usePlaidLink({
    token: linkToken || '',
    onSuccess: handlePlaidSuccess,
    onExit: (exitError, metadata) => {
      if (exitError) {
        handlePlaidError(exitError);
      }
    },
  });

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
        <AlertCircle className="h-4 w-4" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <Button
      onClick={() => open()}
      disabled={!ready || loading}
      className="w-full"
      size="lg"
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {loading ? 'Initializing...' : 'Link Bank Account'}
      {!loading && <Plus className="ml-2 h-4 w-4" />}
    </Button>
  );
}
