'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Plus, CheckCircle } from 'lucide-react';

// User-friendly error messages for common Plaid errors
const ERROR_MESSAGES: { [key: string]: string } = {
  'INVALID_CREDENTIALS': 'Incorrect username or password. Please double-check and try again.',
  'INVALID_MFA': 'Incorrect verification code. Please try again.',
  'INSTITUTION_ERROR': 'Your bank is temporarily unavailable. Try again in a few minutes.',
  'INSTITUTION_DOWN': 'Your bank is down for maintenance. Please try later.',
  'INSTITUTION_NOT_RESPONDING': 'Your bank is not responding. Please try again shortly.',
  'NO_ACCOUNTS': 'No eligible accounts found at this institution.',
  'ITEM_LOCKED': 'Your account is locked. Please unlock it with your bank first.',
};

function getErrorMessage(errorCode: string): string {
  return ERROR_MESSAGES[errorCode] || 'Something went wrong. Please try again.';
}

interface PlaidLinkButtonProps {
  onSuccess?: (metadata: any) => void;
  onError?: (error: any) => void;
  userId?: string;
}

export function PlaidLinkButton({ onSuccess, onError }: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exchanging, setExchanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectedItems, setConnectedItems] = useState<any[]>([]);

  // Step 1: Fetch link token on mount
  useEffect(() => {
    const fetchLinkToken = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/plaid/create-link-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error('Failed to create link token');
        }

        const data = await response.json();
        setLinkToken(data.linkToken || data.link_token);
      } catch (err: any) {
        console.error('[v0] Error fetching link token:', err);
        setError('Unable to initialize bank connection. Please refresh and try again.');
        setStatus('error');
      } finally {
        setLoading(false);
      }
    };

    fetchLinkToken();
  }, []);

  // Step 2: Handle successful Link completion
  const handlePlaidSuccess = useCallback(async (publicToken: string, metadata: any) => {
    setExchanging(true);
    setError(null);
    setStatus('idle');

    try {
      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicToken,
          metadata,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Exchange failed');
      }

      const result = await response.json();
      
      setStatus('success');
      setConnectedItems((prev) => [
        ...prev,
        {
          institution: metadata.institution?.name || 'Bank',
          accounts: metadata.accounts || [],
        },
      ]);

      onSuccess?.(result);
    } catch (err: any) {
      console.error('[v0] Token exchange failed:', err);
      setError('Failed to connect your account. Please try again.');
      setStatus('error');
      onError?.(err);
    } finally {
      setExchanging(false);
    }
  }, [onSuccess, onError]);

  // Step 3: Handle user exit or error
  const handlePlaidExit = useCallback((exitError: any, metadata: any) => {
    if (!exitError) {
      // User simply closed Link — no error
      console.log('[v0] User exited Plaid Link');
      return;
    }

    console.warn('[v0] Plaid Link exit with error:', exitError, metadata);
    setStatus('error');
    setError(getErrorMessage(exitError.error_code));
    onError?.(exitError);
  }, [onError]);

  // Step 4: Log events for debugging/analytics
  const handlePlaidEvent = useCallback((eventName: string, metadata: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Plaid Event]', eventName, metadata);
    }
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken || '',
    onSuccess: handlePlaidSuccess,
    onExit: handlePlaidExit,
    onEvent: handlePlaidEvent,
  });

  return (
    <div className="w-full space-y-4">
      {/* Error banner */}
      {status === 'error' && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}

      {/* Success banner */}
      {status === 'success' && connectedItems.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 border border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <span className="text-sm text-green-800">
            Connected <strong>{connectedItems[connectedItems.length - 1].institution}</strong> successfully!
          </span>
        </div>
      )}

      {/* Connect button */}
      <Button
        onClick={() => open()}
        disabled={!ready || loading || exchanging}
        className="w-full"
        size="lg"
        variant="default"
      >
        {(loading || exchanging) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? 'Initializing...' : exchanging ? 'Connecting...' : '+ Connect a Bank Account'}
      </Button>

      {/* List of connected institutions */}
      {connectedItems.length > 0 && (
        <div className="mt-6 space-y-3 border-t pt-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Connected Accounts
          </h3>
          {connectedItems.map((item, i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-4 bg-white">
              <p className="font-semibold text-gray-900">{item.institution}</p>
              <ul className="mt-2 space-y-1">
                {item.accounts?.map((account: any) => (
                  <li key={account.id} className="text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>{account.name}</span>
                      <span className="text-gray-400">{account.subtype} •••{account.mask}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
