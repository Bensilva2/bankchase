// Export all workflows
export { moneyTransferWorkflow, type TransferInput, type TransferOutput } from './transfer'
export { accountOpeningWorkflow, type AccountOpeningInput, type AccountOpeningOutput } from './account-opening'
export { loanApplicationWorkflow, type LoanApplicationInput, type LoanApplicationOutput } from './loan-application'
export { paymentDisputeWorkflow, type DisputeInput, type DisputeOutput } from './disputes'
export { accountClosureWorkflow, type AccountClosureInput, type AccountClosureOutput } from './account-closure'
export { billPaymentAutomationWorkflow, type BillPaymentInput, type BillPaymentOutput } from './bill-payment'

// Export types
export * from './types'

// Export step functions for testing
export * from './steps/email'
export * from './steps/slack'
export * from './steps/database'
export * from './steps/payment'
