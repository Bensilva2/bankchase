import { useState, useCallback } from 'react'
import {
  sendTransfer,
  sendDemoTransfer,
  getTransferStatus,
  pollTransferStatus,
  getTransferHistory,
  calculateTransferFees,
  TransferRequest,
  TransactionStatus
} from '@/lib/transfer-service'

export interface UseTransferState {
  loading: boolean
  error: string | null
  transactionId: string | null
  status: string | null
  progress: { percent: number; message: string } | null
  transactions: TransactionStatus[]
}

/**
 * React hook for managing transfers
 */
export function useTransfer() {
  const [state, setState] = useState<UseTransferState>({
    loading: false,
    error: null,
    transactionId: null,
    status: null,
    progress: null,
    transactions: []
  })

  /**
   * Send a transfer
   */
  const sendTransferRequest = useCallback(async (request: TransferRequest) => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }))

    try {
      const result = await sendTransfer(request)

      if (!result.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Transfer failed'
        }))
        return false
      }

      setState(prev => ({
        ...prev,
        loading: false,
        transactionId: result.transactionId || null,
        status: result.status || null,
        progress: { percent: 0, message: 'Transfer initiated' }
      }))

      // Start polling
      if (result.transactionId) {
        pollTransferRequest(result.transactionId)
      }

      return true
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Transfer failed'
      }))
      return false
    }
  }, [])

  /**
   * Send a demo transfer (no auth required)
   */
  const sendDemo = useCallback(async (request?: Partial<TransferRequest>) => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }))

    try {
      const result = await sendDemoTransfer(request)

      if (!result.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Transfer failed'
        }))
        return false
      }

      setState(prev => ({
        ...prev,
        loading: false,
        transactionId: result.transactionId || null,
        status: 'completed',
        progress: { percent: 100, message: 'Transfer completed' }
      }))

      return true
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Transfer failed'
      }))
      return false
    }
  }, [])

  /**
   * Check transfer status
   */
  const checkStatus = useCallback(async (transactionId: string) => {
    try {
      const result = await getTransferStatus(transactionId)

      if (result.success) {
        setState(prev => ({
          ...prev,
          status: result.transaction?.status || null,
          progress: result.progress || null
        }))
      }

      return result
    } catch (error) {
      console.error('[v0] Status check error:', error)
      return { success: false }
    }
  }, [])

  /**
   * Poll transfer until completion
   */
  const pollTransferRequest = useCallback(async (transactionId: string) => {
    const result = await pollTransferStatus(transactionId, (progress) => {
      setState(prev => ({
        ...prev,
        progress
      }))
    })

    setState(prev => ({
      ...prev,
      status: result.status || null
    }))

    return result
  }, [])

  /**
   * Load transfer history
   */
  const loadHistory = useCallback(async () => {
    try {
      const result = await getTransferHistory()

      if (result.success) {
        setState(prev => ({
          ...prev,
          transactions: result.transactions || []
        }))
      }

      return result
    } catch (error) {
      console.error('[v0] History load error:', error)
      return { success: false }
    }
  }, [])

  /**
   * Reset transfer state
   */
  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      transactionId: null,
      status: null,
      progress: null,
      transactions: []
    })
  }, [])

  return {
    ...state,
    sendTransfer: sendTransferRequest,
    sendDemo,
    checkStatus,
    pollTransfer: pollTransferRequest,
    loadHistory,
    reset,
    calculateFees: calculateTransferFees
  }
}
