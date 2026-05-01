import { start } from 'workflow/api'
import { moneyTransferWorkflow } from '@/lib/workflows/transfer'
import { accountOpeningWorkflow } from '@/lib/workflows/account-opening'
import { loanApplicationWorkflow } from '@/lib/workflows/loan-application'
import { paymentDisputeWorkflow } from '@/lib/workflows/disputes'
import { accountClosureWorkflow } from '@/lib/workflows/account-closure'
import { billPaymentAutomationWorkflow } from '@/lib/workflows/bill-payment'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { workflowType, input } = body

    let workflowRun: any

    switch (workflowType) {
      case 'transfer': {
        workflowRun = await start(moneyTransferWorkflow, [input])
        break
      }

      case 'account-opening': {
        workflowRun = await start(accountOpeningWorkflow, [input])
        break
      }

      case 'loan-application': {
        workflowRun = await start(loanApplicationWorkflow, [input])
        break
      }

      case 'dispute': {
        workflowRun = await start(paymentDisputeWorkflow, [input])
        break
      }

      case 'account-closure': {
        workflowRun = await start(accountClosureWorkflow, [input])
        break
      }

      case 'bill-payment': {
        workflowRun = await start(billPaymentAutomationWorkflow, [input])
        break
      }

      default: {
        return new Response(
          JSON.stringify({ error: `Unknown workflow type: ${workflowType}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        )
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        runId: workflowRun.runId,
        workflowType,
        message: `${workflowType} workflow started successfully`,
      }),
      { status: 202, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('[API] Workflow error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
