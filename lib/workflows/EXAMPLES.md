# Workflow Examples

This document provides practical examples of how to use each BankChase workflow.

## Money Transfer Example

```typescript
// Trigger a transfer via API
const response = await fetch('/api/workflows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workflowType: 'transfer',
    input: {
      senderId: 'user123',
      senderEmail: 'john@example.com',
      senderName: 'John Doe',
      recipientId: 'user456',
      recipientName: 'Jane Smith',
      amount: 500
    }
  })
})

const { runId } = await response.json()

// Check status
const statusResponse = await fetch(`/api/workflows/${runId}`)
const { status, result } = await statusResponse.json()

console.log(`Transfer status: ${status}`)
if (result?.success) {
  console.log(`Transaction ID: ${result.transactionId}`)
}
```

## Account Opening Example

```typescript
// Start account opening workflow
const response = await fetch('/api/workflows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workflowType: 'account-opening',
    input: {
      email: 'newuser@example.com',
      fullName: 'Alice Johnson',
      dateOfBirth: '1990-05-15',
      ssn: '123-45-6789',
      address: '123 Main St, Anytown, USA'
    }
  })
})

const { runId } = await response.json()

// Later, after user uploads documents, resume the hook
const documentToken = `account-docs-newuser@example.com`
const resumeResponse = await fetch('/api/workflows/hooks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: documentToken,
    data: {
      documentsVerified: true
    }
  })
})

// Then, after manual approval, resume approval hook
const approvalToken = `account-approve-newuser@example.com`
const approvalResponse = await fetch('/api/workflows/hooks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: approvalToken,
    data: {
      approved: true,
      reviewer: 'alice_admin'
    }
  })
})
```

## Loan Application Example

```typescript
// Start loan application workflow
const response = await fetch('/api/workflows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workflowType: 'loan-application',
    input: {
      userId: 'user123',
      userEmail: 'john@example.com',
      userName: 'John Doe',
      requestedAmount: 50000,
      loanTerm: 60,
      purpose: 'Home renovation'
    }
  })
})

const { runId } = await response.json()

// Documents are verified via document hook
const docToken = `loan-docs-app123`
await fetch('/api/workflows/hooks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: docToken,
    data: { documentsVerified: true }
  })
})

// User receives email with loan offer and accepts it
const acceptToken = `loan-accept-app123`
await fetch('/api/workflows/hooks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: acceptToken,
    data: { accepted: true }
  })
})

// Workflow auto-completes with funding
const statusResponse = await fetch(`/api/workflows/${runId}`)
const { result } = await statusResponse.json()

console.log(`Loan status: ${result.status}`)
console.log(`Funded amount: $${result.offer.amount}`)
console.log(`Interest rate: ${result.offer.rate}%`)
```

## Payment Dispute Example

```typescript
// Customer initiates dispute
const response = await fetch('/api/workflows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workflowType: 'dispute',
    input: {
      userId: 'user123',
      userEmail: 'john@example.com',
      transactionId: 'txn_abc123',
      amount: 150,
      reason: 'unauthorized_transaction',
      description: 'I did not authorize this transaction'
    }
  })
})

const { runId } = await response.json()
const disputeResponse = await fetch(`/api/workflows/${runId}`)
const { result } = await disputeResponse.json()
const { disputeId } = result

// Later, customer submits evidence via webhook
// The webhook URL is provided to the customer
const evidenceWebhookToken = 'wh_abc123xyz' // From workflow
const evidenceResponse = await fetch(
  `/api/workflows/webhooks?token=${evidenceWebhookToken}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      evidence: 'base64_encoded_evidence_document',
      suspicious: true,
      notes: 'This transaction was fraudulent'
    })
  }
)

// Workflow completes after investigation
// Customer receives resolution email
```

## Account Closure Example

```typescript
// User requests account closure
const response = await fetch('/api/workflows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workflowType: 'account-closure',
    input: {
      userId: 'user123',
      userEmail: 'john@example.com',
      userName: 'John Doe',
      reason: 'Moving to another bank'
    }
  })
})

const { runId } = await response.json()

// Admin verifies closure request
const verificationToken = `closure-verify-user123`
await fetch('/api/workflows/hooks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: verificationToken,
    data: {
      verified: true,
      notes: 'Account has no pending transactions'
    }
  })
})

// Workflow completes with archive and confirmation
const statusResponse = await fetch(`/api/workflows/${runId}`)
const { result } = await statusResponse.json()

console.log(`Account status: ${result.status}`) // 'closed'
```

## Bill Payment Example

```typescript
// User sets up automatic bill payment
const response = await fetch('/api/workflows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workflowType: 'bill-payment',
    input: {
      userId: 'user123',
      userEmail: 'john@example.com',
      payeeId: 'payee_utility_123',
      payeeName: 'City Utilities',
      amount: 150,
      dueDate: '2026-05-15',
      frequency: 'monthly' // monthly, weekly, quarterly, or one-time
    }
  })
})

const { runId } = await response.json()

// Workflow processes immediately
const statusResponse = await fetch(`/api/workflows/${runId}`)
const { result } = await statusResponse.json()

if (result.success) {
  console.log(`Payment completed: ${result.paymentId}`)
  console.log(`Next payment scheduled for next month`)
} else {
  console.log(`Payment failed: ${result.error}`)
  // Workflow will retry up to 3 times with exponential backoff
}
```

## Error Handling Examples

```typescript
// Handling workflow errors
const response = await fetch('/api/workflows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workflowType: 'transfer',
    input: {
      senderId: 'user123',
      senderEmail: 'john@example.com',
      senderName: 'John Doe',
      recipientId: 'user123', // ERROR: Same as sender
      recipientName: 'Self',
      amount: 100
    }
  })
})

const data = await response.json()

if (!response.ok) {
  console.error(`Error: ${data.error}`)
}

// Check workflow result for errors
const statusResponse = await fetch(`/api/workflows/${data.runId}`)
const { result } = await statusResponse.json()

if (!result.success) {
  console.error(`Workflow failed: ${result.error}`)
  // Permanent error (FatalError) - won't retry
  // Transient error (RetryableError) - already retried
}
```

## Testing in Browser Console

```javascript
// Start a workflow from browser console
fetch('/api/workflows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workflowType: 'transfer',
    input: {
      senderId: 'test_user_1',
      senderEmail: 'test@example.com',
      senderName: 'Test User',
      recipientId: 'test_user_2',
      recipientName: 'Recipient',
      amount: 100
    }
  })
})
  .then(r => r.json())
  .then(d => {
    console.log('Workflow started:', d.runId)
    // Poll status
    setInterval(() => {
      fetch(`/api/workflows/${d.runId}`)
        .then(r => r.json())
        .then(status => console.log('Status:', status))
    }, 2000)
  })
```

## Integration with Next.js Components

```typescript
// React component to start a transfer
'use client'

import { useState } from 'react'

export function TransferForm() {
  const [loading, setLoading] = useState(false)
  const [runId, setRunId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowType: 'transfer',
          input: {
            senderId: 'user123',
            senderEmail: 'user@example.com',
            senderName: 'John Doe',
            recipientId: 'user456',
            recipientName: 'Jane Smith',
            amount: 500
          }
        })
      })

      const data = await response.json()
      setRunId(data.runId)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Send Transfer'}
        </button>
      </form>
      {runId && <p>Workflow started: {runId}</p>}
    </div>
  )
}
```

## Workflow Status Dashboard

```typescript
// Component to monitor workflow status
'use client'

import { useEffect, useState } from 'react'

interface WorkflowStatus {
  runId: string
  status: 'running' | 'completed' | 'failed'
  result?: any
}

export function WorkflowMonitor({ runId }: { runId: string }) {
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null)

  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch(`/api/workflows/${runId}`)
      const data = await response.json()
      setWorkflowStatus(data)

      // Stop polling when completed
      if (data.status === 'completed' || data.status === 'failed') {
        clearInterval(interval)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [runId])

  if (!workflowStatus) return <div>Loading...</div>

  return (
    <div>
      <h3>Workflow Status</h3>
      <p>Run ID: {workflowStatus.runId}</p>
      <p>Status: {workflowStatus.status}</p>
      {workflowStatus.result && (
        <pre>{JSON.stringify(workflowStatus.result, null, 2)}</pre>
      )}
    </div>
  )
}
```

## CLI Testing

```bash
# Test transfer workflow
curl -X POST http://localhost:3000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "workflowType": "transfer",
    "input": {
      "senderId": "user123",
      "senderEmail": "test@example.com",
      "senderName": "Test User",
      "recipientId": "user456",
      "recipientName": "Recipient",
      "amount": 100
    }
  }'

# Check status (replace RUN_ID with actual run ID from response)
curl http://localhost:3000/api/workflows/RUN_ID

# Resume a hook
curl -X POST http://localhost:3000/api/workflows/hooks \
  -H "Content-Type: application/json" \
  -d '{
    "token": "loan-docs-app123",
    "data": {"documentsVerified": true}
  }'

# Submit webhook evidence
curl -X POST http://localhost:3000/api/workflows/webhooks?token=WEBHOOK_TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "evidence": "base64_data",
    "suspicious": true
  }'
```
