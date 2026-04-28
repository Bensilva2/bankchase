import { createClient } from '@/lib/supabase/server'

export interface DemoTransferRequest {
  to_account_number: string
  amount: number
  days_to_refund?: number
  notes?: string
}

export interface DemoTransferResponse {
  message: string
  transfer_id: string
  status: 'pending' | 'completed'
  to_account: string
  amount: number
  will_refund_in?: string
}

export interface BulkTransferRequest {
  amount: number
  days_to_refund?: number
}

/**
 * Get or create admin's demo source account
 */
export async function getAdminDemoAccount(
  adminUserId: string,
  orgId: string = 'default'
) {
  const supabase = await createClient()

  // Try to find existing admin demo account
  const { data: existing, error: selectError } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', adminUserId)
    .eq('is_demo_account', true)
    .single()

  if (existing && !selectError) {
    return existing
  }

  // Create new admin demo account with large balance
  const accountNumber = `DEMO-ADMIN-${adminUserId.substring(0, 8)}`
  
  const { data: newAccount, error: createError } = await supabase
    .from('accounts')
    .insert({
      account_number: accountNumber,
      user_id: adminUserId,
      org_id: orgId,
      balance: 1000000.0,
      is_demo_account: true,
      account_type: 'demo',
    })
    .select()
    .single()

  if (createError) {
    console.error('Error creating admin demo account:', createError)
    throw createError
  }

  return newAccount
}

/**
 * Send demo money to a specific account (registered or external)
 */
export async function adminDemoTransfer(
  adminUserId: string,
  request: DemoTransferRequest,
  orgId: string = 'default'
): Promise<DemoTransferResponse> {
  const supabase = await createClient()

  if (request.amount <= 0) {
    throw new Error('Amount must be positive')
  }

  // Get admin's demo source account
  const adminAccount = await getAdminDemoAccount(adminUserId, orgId)

  if (adminAccount.balance < request.amount) {
    throw new Error('Insufficient demo balance in admin account')
  }

  // Find or create destination account
  const { data: existingAccount } = await supabase
    .from('accounts')
    .select('*')
    .eq('account_number', request.to_account_number)
    .single()

  const isInternal = existingAccount && existingAccount.user_id !== null

  let toAccount = existingAccount

  if (!toAccount) {
    // Create external account
    const { data: newAccount, error: createError } = await supabase
      .from('accounts')
      .insert({
        account_number: request.to_account_number,
        user_id: null,
        org_id: orgId,
        balance: 0.0,
        is_demo_account: true,
        account_type: 'demo',
      })
      .select()
      .single()

    if (createError) {
      throw createError
    }

    toAccount = newAccount
  }

  // Determine expiry for external transfers
  const expiresAt = isInternal
    ? null
    : new Date(Date.now() + (request.days_to_refund ?? 7) * 24 * 60 * 60 * 1000).toISOString()

  const transferStatus = isInternal ? 'completed' : 'pending'

  // Create transfer record
  const { data: transfer, error: transferError } = await supabase
    .from('demo_transfers')
    .insert({
      admin_user_id: adminUserId,
      from_account_id: adminAccount.id,
      to_account_number: request.to_account_number,
      amount: request.amount,
      status: transferStatus,
      transfer_type: isInternal ? 'internal' : 'external',
      expires_at: expiresAt,
      notes: request.notes,
      org_id: orgId,
    })
    .select()
    .single()

  if (transferError) {
    throw transferError
  }

  // Update balances
  const { error: adminUpdateError } = await supabase
    .from('accounts')
    .update({ balance: adminAccount.balance - request.amount })
    .eq('id', adminAccount.id)

  if (adminUpdateError) {
    throw adminUpdateError
  }

  // Update recipient balance
  const { error: recipientUpdateError } = await supabase
    .from('accounts')
    .update({ balance: toAccount.balance + request.amount })
    .eq('id', toAccount.id)

  if (recipientUpdateError) {
    throw recipientUpdateError
  }

  return {
    message: 'Demo transfer successful',
    transfer_id: transfer.transfer_id,
    status: transferStatus,
    to_account: request.to_account_number,
    amount: request.amount,
    will_refund_in: isInternal ? undefined : `${request.days_to_refund ?? 7} days`,
  }
}

/**
 * Send demo money to all registered users in the organization
 */
export async function bulkDemoToAllUsers(
  adminUserId: string,
  request: BulkTransferRequest,
  orgId: string = 'default'
) {
  const supabase = await createClient()

  const adminAccount = await getAdminDemoAccount(adminUserId, orgId)

  // Get all users in org
  const { data: members } = await supabase
    .from('neon_auth.member')
    .select('userId')
    .eq('organizationId', orgId)

  if (!members || members.length === 0) {
    throw new Error('No users found in organization')
  }

  const totalAmount = request.amount * members.length

  if (adminAccount.balance < totalAmount) {
    throw new Error('Insufficient demo balance for bulk transfer')
  }

  const transferIds: string[] = []

  for (const member of members) {
    // Get or create user's account
    const { data: userAccount } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', member.userId)
      .eq('is_demo_account', true)
      .single()

    let toAccount = userAccount

    if (!toAccount) {
      const { data: newAccount } = await supabase
        .from('accounts')
        .insert({
          account_number: `USER-${member.userId.substring(0, 8)}`,
          user_id: member.userId,
          org_id: orgId,
          balance: 0.0,
          is_demo_account: true,
          account_type: 'demo',
        })
        .select()
        .single()

      toAccount = newAccount
    }

    // Create transfer
    const { data: transfer } = await supabase
      .from('demo_transfers')
      .insert({
        admin_user_id: adminUserId,
        from_account_id: adminAccount.id,
        to_account_number: toAccount.account_number,
        amount: request.amount,
        status: 'completed',
        transfer_type: 'internal',
        org_id: orgId,
      })
      .select()
      .single()

    if (transfer) {
      transferIds.push(transfer.transfer_id)
    }

    // Update balances
    await supabase
      .from('accounts')
      .update({ balance: toAccount.balance + request.amount })
      .eq('id', toAccount.id)
  }

  // Update admin balance once
  await supabase
    .from('accounts')
    .update({ balance: adminAccount.balance - totalAmount })
    .eq('id', adminAccount.id)

  return {
    message: `Successfully sent ${request.amount} demo money to ${members.length} users`,
    total_users: members.length,
    total_amount_sent: totalAmount,
    transfer_ids: transferIds,
  }
}

/**
 * Process expired demo transfers and refund them
 * This should be called by a scheduled job daily
 */
export async function processDemoRefunds() {
  const supabase = await createClient()

  // Find all expired pending transfers
  const now = new Date().toISOString()

  const { data: expiredTransfers, error: selectError } = await supabase
    .from('demo_transfers')
    .select('*')
    .eq('status', 'pending')
    .lte('expires_at', now)

  if (selectError) {
    console.error('Error fetching expired transfers:', selectError)
    return
  }

  if (!expiredTransfers || expiredTransfers.length === 0) {
    console.log('No expired transfers to process')
    return
  }

  for (const transfer of expiredTransfers) {
    // Get admin account
    const { data: adminAccount } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', transfer.from_account_id)
      .single()

    // Get receiver account
    const { data: receiverAccount } = await supabase
      .from('accounts')
      .select('*')
      .eq('account_number', transfer.to_account_number)
      .single()

    if (adminAccount) {
      // Refund to admin
      await supabase
        .from('accounts')
        .update({ balance: adminAccount.balance + transfer.amount })
        .eq('id', adminAccount.id)
    }

    if (receiverAccount && receiverAccount.balance >= transfer.amount) {
      // Deduct from receiver only if they have enough
      await supabase
        .from('accounts')
        .update({ balance: Math.max(0, receiverAccount.balance - transfer.amount) })
        .eq('id', receiverAccount.id)
    }

    // Mark as refunded
    await supabase
      .from('demo_transfers')
      .update({
        status: 'refunded',
        refunded_at: new Date().toISOString(),
      })
      .eq('id', transfer.id)
  }

  console.log(`Processed ${expiredTransfers.length} expired demo transfers`)
}
