/**
 * Hook for using real operations with real-time updates
 */

import { useCallback, useState, useEffect } from 'react'
import {
  wireTransferOperations,
  settingsOperations,
  assistantOperations,
  accountOperations,
  notificationOperations,
  deviceOperations,
} from '@/lib/real-operations'
import { realtimeSyncCoordinator } from '@/lib/realtime-sync-coordinator'
import type { OperationResult } from '@/lib/realtime-operation-engine'

export interface UseOperationState {
  isLoading: boolean
  error: string | null
  data: any
  success: boolean
}

export function useWireTransfer() {
  const [state, setState] = useState<UseOperationState>({
    isLoading: false,
    error: null,
    data: null,
    success: false,
  })

  const initiateTransfer = useCallback(
    async (data: Parameters<typeof wireTransferOperations.initiateTransfer>[0]) => {
      setState({ isLoading: true, error: null, data: null, success: false })
      try {
        const result = await wireTransferOperations.initiateTransfer(data)
        setState({
          isLoading: false,
          error: result.error || null,
          data: result.data,
          success: result.success,
        })
        return result
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        setState({ isLoading: false, error: errorMsg, data: null, success: false })
        throw error
      }
    },
    [],
  )

  const verifyOTP = useCallback(
    async (transferId: string, code: string) => {
      setState({ isLoading: true, error: null, data: null, success: false })
      try {
        const result = await wireTransferOperations.verifyOTP(transferId, code)
        setState({
          isLoading: false,
          error: result.error || null,
          data: result.data,
          success: result.success,
        })
        return result
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        setState({ isLoading: false, error: errorMsg, data: null, success: false })
        throw error
      }
    },
    [],
  )

  const verifyCOT = useCallback(
    async (transferId: string, code: string) => {
      setState({ isLoading: true, error: null, data: null, success: false })
      try {
        const result = await wireTransferOperations.verifyCOT(transferId, code)
        setState({
          isLoading: false,
          error: result.error || null,
          data: result.data,
          success: result.success,
        })
        return result
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        setState({ isLoading: false, error: errorMsg, data: null, success: false })
        throw error
      }
    },
    [],
  )

  const verifyTax = useCallback(
    async (transferId: string, code: string) => {
      setState({ isLoading: true, error: null, data: null, success: false })
      try {
        const result = await wireTransferOperations.verifyTax(transferId, code)
        setState({
          isLoading: false,
          error: result.error || null,
          data: result.data,
          success: result.success,
        })
        return result
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        setState({ isLoading: false, error: errorMsg, data: null, success: false })
        throw error
      }
    },
    [],
  )

  const processTransfer = useCallback(
    async (transferId: string) => {
      setState({ isLoading: true, error: null, data: null, success: false })
      try {
        const result = await wireTransferOperations.processTransfer(transferId)
        setState({
          isLoading: false,
          error: result.error || null,
          data: result.data,
          success: result.success,
        })
        return result
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        setState({ isLoading: false, error: errorMsg, data: null, success: false })
        throw error
      }
    },
    [],
  )

  return { ...state, initiateTransfer, verifyOTP, verifyCOT, verifyTax, processTransfer }
}

export function useSettings() {
  const [state, setState] = useState<UseOperationState>({
    isLoading: false,
    error: null,
    data: null,
    success: false,
  })

  const updateSetting = useCallback(
    async (category: string, key: string, value: any) => {
      setState({ isLoading: true, error: null, data: null, success: false })
      try {
        const result = await settingsOperations.updateSetting(category, key, value)
        setState({
          isLoading: false,
          error: result.error || null,
          data: result.data,
          success: result.success,
        })
        return result
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        setState({ isLoading: false, error: errorMsg, data: null, success: false })
        throw error
      }
    },
    [],
  )

  const resetCategory = useCallback(
    async (category: string) => {
      setState({ isLoading: true, error: null, data: null, success: false })
      try {
        const result = await settingsOperations.resetCategory(category)
        setState({
          isLoading: false,
          error: result.error || null,
          data: result.data,
          success: result.success,
        })
        return result
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        setState({ isLoading: false, error: errorMsg, data: null, success: false })
        throw error
      }
    },
    [],
  )

  return { ...state, updateSetting, resetCategory }
}

export function useAssistant() {
  const [state, setState] = useState<UseOperationState>({
    isLoading: false,
    error: null,
    data: null,
    success: false,
  })

  const getResponse = useCallback(
    async (message: string, context: any = {}) => {
      setState({ isLoading: true, error: null, data: null, success: false })
      try {
        const result = await assistantOperations.getResponse(message, context)
        setState({
          isLoading: false,
          error: result.error || null,
          data: result.data,
          success: result.success,
        })
        return result
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        setState({ isLoading: false, error: errorMsg, data: null, success: false })
        throw error
      }
    },
    [],
  )

  return { ...state, getResponse }
}

export function useNotifications() {
  const markAsRead = useCallback(async (notificationId: string) => {
    return notificationOperations.markAsRead(notificationId)
  }, [])

  const deleteNotification = useCallback(async (notificationId: string) => {
    return notificationOperations.deleteNotification(notificationId)
  }, [])

  return { markAsRead, deleteNotification }
}

export function useDevices() {
  const unlinkDevice = useCallback(async (deviceId: string) => {
    return deviceOperations.unlinkDevice(deviceId)
  }, [])

  const renameDevice = useCallback(async (deviceId: string, newName: string) => {
    return deviceOperations.renamDevice(deviceId, newName)
  }, [])

  return { unlinkDevice, renameDevice }
}

export function useAccounts() {
  const getBalance = useCallback(async (accountId: string) => {
    return accountOperations.getAccountBalance(accountId)
  }, [])

  const getTransactions = useCallback(async (accountId: string, limit?: number) => {
    return accountOperations.getTransactions(accountId, limit)
  }, [])

  return { getBalance, getTransactions }
}
