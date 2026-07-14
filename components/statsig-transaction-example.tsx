'use client';

import React, { useState } from 'react';
import { useStatsig } from '@/hooks/use-statsig';
import { ANALYTICS_EVENTS, FEATURE_GATES, DYNAMIC_CONFIGS } from '@/lib/statsig-integration';
import {
  trackTransactionEvent,
  trackButtonClick,
  trackFormSubmission,
  trackErrorEvent,
} from '@/lib/statsig-tracking';

/**
 * Example component demonstrating Statsig integration
 * Shows feature gates, custom events, dynamic configs, and experiments
 */
export function StatsigTransactionExample() {
  const { checkFeatureGate, logEvent, getDynamicConfig, getExperiment } = useStatsig();
  const [amount, setAmount] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Check if experimental transaction UI is enabled
  const useExperimentalUI = checkFeatureGate(FEATURE_GATES.EXPERIMENTAL_TRANSACTIONS);

  // Get transfer limits from dynamic config
  const transferConfig = getDynamicConfig(DYNAMIC_CONFIGS.TRANSFER_LIMITS);
  const maxTransfer = transferConfig?.get('max_amount', 100000) || 100000;
  const dailyLimit = transferConfig?.get('daily_limit', 250000) || 250000;

  // Check if user is in experiment
  const experiment = getExperiment('transaction_redesign');
  const experimentVariant = experiment?.getGroupName?.();

  const handleSubmitClick = async () => {
    try {
      // Track button click
      trackButtonClick(logEvent, 'submit_transaction', {
        variant: experimentVariant || 'control',
        amount,
      });

      // Track form submission
      trackFormSubmission(logEvent, 'transfer_form', {
        amount,
        maxLimit: maxTransfer,
      });

      setStatus('loading');

      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validate amount
      if (amount > maxTransfer) {
        throw new Error(`Amount exceeds maximum transfer of $${maxTransfer}`);
      }

      // Track successful transaction
      trackTransactionEvent(
        logEvent,
        ANALYTICS_EVENTS.TRANSACTION_COMPLETED,
        amount,
        {
          accountId: 'account-123',
          type: 'transfer',
          status: 'completed',
          method: 'internal',
        }
      );

      setStatus('success');
      setAmount(0);
    } catch (error) {
      // Track error
      trackErrorEvent(logEvent, error as Error, {
        component: 'StatsigTransactionExample',
        action: 'submitTransaction',
        severity: 'error',
      });

      // Also log with transaction-specific data
      trackTransactionEvent(
        logEvent,
        ANALYTICS_EVENTS.TRANSACTION_FAILED,
        amount,
        {
          error: (error as Error).message,
          type: 'transfer',
        }
      );

      setStatus('error');
    }
  };

  // Conditional rendering based on feature gate
  if (useExperimentalUI) {
    return (
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
        <div className="max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {experimentVariant === 'treatment' ? '✨ New' : 'Enhanced'} Transfer
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Enter amount"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-600 mt-1">
                Max: ${maxTransfer.toLocaleString()}
              </p>
            </div>

            {amount > maxTransfer && (
              <div className="p-3 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
                Amount exceeds limit of ${maxTransfer}
              </div>
            )}

            <button
              onClick={handleSubmitClick}
              disabled={status === 'loading' || amount <= 0 || amount > maxTransfer}
              className={`w-full py-2 px-4 rounded-lg font-medium transition ${
                status === 'loading'
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {status === 'loading' ? 'Processing...' : 'Send Transfer'}
            </button>

            {status === 'success' && (
              <div className="p-3 bg-green-100 border border-green-300 rounded text-green-800 text-sm">
                ✓ Transfer completed successfully
              </div>
            )}

            {status === 'error' && (
              <div className="p-3 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
                ✗ Transfer failed. Please try again.
              </div>
            )}

            <div className="text-xs text-gray-600 pt-2 border-t">
              <p>Experiment: {experimentVariant || 'control'}</p>
              <p>Daily Limit: ${dailyLimit.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Legacy UI
  return (
    <div className="p-6 bg-gray-50 rounded-lg border border-gray-300">
      <div className="max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Transfer Funds</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="$0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>

          <button
            onClick={handleSubmitClick}
            disabled={status === 'loading'}
            className="w-full py-2 px-3 bg-gray-700 text-white rounded text-sm hover:bg-gray-800 disabled:bg-gray-500"
          >
            Submit
          </button>

          {status === 'success' && (
            <p className="text-sm text-green-700">Success</p>
          )}

          {status === 'error' && (
            <p className="text-sm text-red-700">Error</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatsigTransactionExample;
