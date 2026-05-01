import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function logWorkflowEvent(
  workflowName: string,
  runId: string,
  stepName: string,
  data: Record<string, any>,
  status: 'started' | 'completed' | 'failed' = 'completed',
) {
  'use step'

  try {
    const { error } = await supabase
      .from('workflow_events')
      .insert({
        workflow_name: workflowName,
        run_id: runId,
        step_name: stepName,
        status,
        data,
        created_at: new Date().toISOString(),
      })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('[Database Step] Failed to log event:', error)
    throw error
  }
}

export async function recordTransferTransaction(
  senderId: string,
  recipientId: string,
  amount: number,
  status: string,
  metadata?: Record<string, any>,
) {
  'use step'

  try {
    const { error } = await supabase
      .from('transfers')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        amount,
        status,
        metadata,
        created_at: new Date().toISOString(),
      })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('[Database Step] Failed to record transfer:', error)
    throw error
  }
}

export async function createLoanApplication(
  userId: string,
  amount: number,
  term: number,
  status: string,
) {
  'use step'

  try {
    const { data, error } = await supabase
      .from('loan_applications')
      .insert({
        user_id: userId,
        amount,
        term,
        status,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, applicationId: data?.id }
  } catch (error) {
    console.error('[Database Step] Failed to create loan application:', error)
    throw error
  }
}

export async function updateLoanApplication(
  applicationId: string,
  updates: Record<string, any>,
) {
  'use step'

  try {
    const { error } = await supabase
      .from('loan_applications')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('[Database Step] Failed to update loan application:', error)
    throw error
  }
}

export async function createDispute(
  userId: string,
  transactionId: string,
  reason: string,
) {
  'use step'

  try {
    const { data, error } = await supabase
      .from('disputes')
      .insert({
        user_id: userId,
        transaction_id: transactionId,
        reason,
        status: 'open',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, disputeId: data?.id }
  } catch (error) {
    console.error('[Database Step] Failed to create dispute:', error)
    throw error
  }
}

export async function updateDisputeStatus(
  disputeId: string,
  status: string,
  resolution?: string,
) {
  'use step'

  try {
    const { error } = await supabase
      .from('disputes')
      .update({
        status,
        resolution,
        updated_at: new Date().toISOString(),
      })
      .eq('id', disputeId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('[Database Step] Failed to update dispute status:', error)
    throw error
  }
}

export async function archiveUserData(
  userId: string,
  archiveReason: string,
) {
  'use step'

  try {
    // Archive user data
    const { error: updateError } = await supabase
      .from('users')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        archive_reason: archiveReason,
      })
      .eq('id', userId)

    if (updateError) throw updateError

    // Log the archive event
    const { error: logError } = await supabase
      .from('workflow_events')
      .insert({
        workflow_name: 'account_closure',
        step_name: 'archive_user_data',
        user_id: userId,
        data: { reason: archiveReason },
        created_at: new Date().toISOString(),
      })

    if (logError) throw logError
    return { success: true }
  } catch (error) {
    console.error('[Database Step] Failed to archive user data:', error)
    throw error
  }
}

export async function recordBillPayment(
  userId: string,
  payeeId: string,
  amount: number,
  dueDate: string,
  status: string,
) {
  'use step'

  try {
    const { data, error } = await supabase
      .from('bill_payments')
      .insert({
        user_id: userId,
        payee_id: payeeId,
        amount,
        due_date: dueDate,
        status,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, paymentId: data?.id }
  } catch (error) {
    console.error('[Database Step] Failed to record bill payment:', error)
    throw error
  }
}
