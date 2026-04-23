# Real-Time Operations Guide

## Overview

This guide explains how all real-time operations work smoothly across the entire Chase Banking application with real functions, automatic synchronization, and seamless coordination.

## Architecture

### 1. Real-Time Operation Engine
**File**: `lib/realtime-operation-engine.ts`

The core engine that manages all operations with:
- **Automatic Timeout Handling**: 5-second default timeout with exponential backoff
- **Retry Mechanism**: Up to 3 retries by default with exponential backoff
- **Flight Deduplication**: Prevents duplicate operations in flight
- **Operation Queuing**: Queues operations by priority (high, normal, low)
- **Automatic Sync**: Triggers real-time sync on successful operations

```typescript
// Execute operation with automatic sync
const result = await realtimeOperationEngine.executeOperation(
  'operation-id',
  async () => {
    // Your operation logic
    return { success: true, data: {...} }
  },
  { timeout: 5000, retries: 2, cache: true, priority: 'high' }
)
```

### 2. Real Operations Library
**File**: `lib/real-operations.ts`

Implements all banking operations:

#### Wire Transfer Operations
```typescript
// Initiate wire transfer
await wireTransferOperations.initiateTransfer({
  amount: 5000,
  recipientName: 'John Doe',
  recipientBank: 'Bank of America',
  routingNumber: '021000021',
  accountNumber: '123456789',
  wireType: 'domestic'
})

// Verify OTP
await wireTransferOperations.verifyOTP(transferId, '123456')

// Verify COT
await wireTransferOperations.verifyCOT(transferId, '654321')

// Verify Tax
await wireTransferOperations.verifyTax(transferId, '789012')

// Process Transfer
await wireTransferOperations.processTransfer(transferId)
```

#### Settings Operations
```typescript
// Update single setting
await settingsOperations.updateSetting('notifications', 'push', true)

// Update multiple settings
await settingsOperations.updateMultipleSettings([
  { category: 'notifications', key: 'push', value: true },
  { category: 'security', key: 'biometric', value: false }
])

// Reset category
await settingsOperations.resetCategory('notifications')
```

#### Virtual Assistant Operations
```typescript
// Get AI response
await assistantOperations.getResponse(
  'How do I wire transfer?',
  { context: 'wire_transfer' }
)
```

#### Account Operations
```typescript
// Get account balance
await accountOperations.getAccountBalance('account-123')

// Get transactions
await accountOperations.getTransactions('account-123', 10)
```

### 3. Real-Time Sync Coordinator
**File**: `lib/realtime-sync-coordinator.ts`

Coordinates real-time updates across the app:
- **Message Queuing**: Batches updates for smooth processing
- **Subscriber Notification**: Instantly notifies all subscribers
- **Auto-Refresh**: Refreshes data every 5 seconds when active
- **Sync State Tracking**: Tracks sync status to prevent overwhelming UI

```typescript
// Subscribe to real-time updates
realtimeSyncCoordinator.subscribe('wire-transfer', (data) => {
  console.log('Wire transfer updated:', data)
})

// Publish update
await realtimeSyncCoordinator.publishUpdate('wire-transfer', newData)

// Wait for sync
await realtimeSyncCoordinator.waitForSync('wire-transfer')
```

## React Hooks

### useWireTransfer()
Use for all wire transfer operations:
```typescript
const { 
  isLoading, 
  error, 
  data, 
  success,
  initiateTransfer,
  verifyOTP,
  verifyCOT,
  verifyTax,
  processTransfer
} = useWireTransfer()

// Initiate transfer
const result = await initiateTransfer({
  amount: 5000,
  recipientName: 'John Doe',
  // ... other fields
})
```

### useSettings()
Use for settings operations:
```typescript
const { 
  isLoading, 
  error, 
  updateSetting, 
  resetCategory 
} = useSettings()

// Update setting
await updateSetting('notifications', 'push', true)
```

### useAssistant()
Use for virtual assistant:
```typescript
const { isLoading, getResponse } = useAssistant()

// Get response
const { data } = await getResponse('How do I wire transfer?')
```

### useNotifications()
Use for notification operations:
```typescript
const { markAsRead, deleteNotification } = useNotifications()

// Mark as read
await markAsRead('notification-id')
```

### useDevices()
Use for device management:
```typescript
const { unlinkDevice, renameDevice } = useDevices()

// Unlink device
await unlinkDevice('device-id')
```

### useAccounts()
Use for account operations:
```typescript
const { getBalance, getTransactions } = useAccounts()

// Get balance
const { data } = await getBalance('account-id')
```

## Real-Time Flow

1. **User Action**: User initiates operation (e.g., wire transfer)
2. **Operation Execution**: `executeOperation()` handles the operation
3. **Timeout/Retry**: Automatic timeout with exponential backoff
4. **Success Check**: If successful, automatically publishes sync
5. **Real-Time Sync**: `realtimeSyncCoordinator` notifies all subscribers
6. **UI Update**: All components subscribed to that data update instantly

## Error Handling

All operations include automatic retry with exponential backoff:

```typescript
// First attempt: immediate
// Second attempt: 100ms delay
// Third attempt: 400ms delay

// Custom configuration
await realtimeOperationEngine.executeOperation(
  'operation-id',
  operation,
  { 
    timeout: 10000,  // 10 seconds
    retries: 5,      // 5 retries
    priority: 'high' 
  }
)
```

## Performance Optimization

1. **Operation Deduplication**: Prevents duplicate operations in flight
2. **Operation Queuing**: Processes by priority to handle high-load scenarios
3. **Caching**: Stores results to avoid redundant requests
4. **Batch Publishing**: Groups updates for smooth UI rendering
5. **Auto-Refresh**: Background sync every 5 seconds

## Real-Time Sync Status

Track operation status:
```typescript
// Get operation status
const status = realtimeOperationEngine.getOperationStatus('operation-id')
// Returns: 'pending' | 'processing' | 'completed' | 'queued'
```

## Integration Example

```typescript
import { useWireTransfer } from '@/hooks/use-real-operations'
import { useRealtimeSync } from '@/hooks/use-realtime-sync'

export function WireTransferComponent() {
  const { initiateTransfer, isLoading } = useWireTransfer()
  const { subscribe } = useRealtimeSync()

  // Subscribe to transfer updates
  useEffect(() => {
    const unsubscribe = subscribe('wire-transfer', (data) => {
      console.log('Transfer status:', data.status)
    })
    return unsubscribe
  }, [])

  const handleTransfer = async () => {
    const result = await initiateTransfer({
      amount: 5000,
      recipientName: 'John Doe',
      recipientBank: 'Bank of America',
      routingNumber: '021000021',
      accountNumber: '123456789',
      wireType: 'domestic'
    })

    if (result.success) {
      console.log('Transfer ID:', result.data.transferId)
    }
  }

  return (
    <button onClick={handleTransfer} disabled={isLoading}>
      {isLoading ? 'Processing...' : 'Send Wire Transfer'}
    </button>
  )
}
```

## Summary

The real-time operations system provides:
- ✅ All options load properly before display
- ✅ All operations work smoothly with real functions
- ✅ Automatic real-time sync across all components
- ✅ Retry and timeout handling
- ✅ Operation deduplication and queuing
- ✅ Seamless integration across the entire app

Everything is coordinated and works together smoothly!
