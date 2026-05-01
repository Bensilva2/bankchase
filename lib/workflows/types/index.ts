// Common workflow types and enums

export enum WorkflowStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export enum WorkflowType {
  Transfer = 'transfer',
  AccountOpening = 'account-opening',
  LoanApplication = 'loan-application',
  PaymentDispute = 'dispute',
  AccountClosure = 'account-closure',
  BillPayment = 'bill-payment',
}

export interface WorkflowEvent {
  id?: string
  workflowName: string
  runId: string
  stepName: string
  status: 'started' | 'completed' | 'failed'
  data: Record<string, any>
  createdAt: string
}

export interface WorkflowRun {
  runId: string
  workflowType: WorkflowType
  status: WorkflowStatus
  input: Record<string, any>
  result?: Record<string, any>
  error?: string
  startedAt: string
  completedAt?: string
  duration?: number
}

export interface WorkflowHook {
  token: string
  workflowRunId: string
  status: 'pending' | 'resolved' | 'timeout'
  resolvedAt?: string
  resolvedData?: Record<string, any>
}

export interface WorkflowResponse<T = any> {
  success: boolean
  status: string
  data?: T
  error?: string
}

// Error classes for workflows
export class WorkflowError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
  ) {
    super(message)
    this.name = 'WorkflowError'
  }
}

export class WorkflowValidationError extends WorkflowError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', false)
    this.name = 'WorkflowValidationError'
  }
}

export class WorkflowNotFoundError extends WorkflowError {
  constructor(resourceType: string, resourceId: string) {
    super(
      `${resourceType} with ID ${resourceId} not found`,
      'NOT_FOUND',
      false,
    )
    this.name = 'WorkflowNotFoundError'
  }
}

export class WorkflowTimeoutError extends WorkflowError {
  constructor(message: string) {
    super(message, 'TIMEOUT', true)
    this.name = 'WorkflowTimeoutError'
  }
}
