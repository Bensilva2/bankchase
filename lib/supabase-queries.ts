import { createClient } from './supabase/client'

// Auth helpers - these are client-side only
export async function signUpUser(email: string, password: string, firstName?: string, lastName?: string) {
  if (typeof window === 'undefined') {
    throw new Error('Auth operations must be called from client-side')
  }

  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw error

  // Create profile after signup
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
      })

    if (profileError) throw profileError
  }

  return data
}

export async function signInUser(email: string, password: string) {
  if (typeof window === 'undefined') {
    throw new Error('Auth operations must be called from client-side')
  }

  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOutUser() {
  if (typeof window === 'undefined') {
    throw new Error('Auth operations must be called from client-side')
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  if (typeof window === 'undefined') {
    throw new Error('Auth operations must be called from client-side')
  }

  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Profile helpers
export async function getUserProfile(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export async function updateUserProfile(userId: string, updates: any) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Account helpers
export async function getUserAccounts(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createAccount(userId: string, accountNumber: string, accountType: string = 'savings') {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('accounts')
    .insert({
      user_id: userId,
      account_number: accountNumber,
      account_type: accountType,
      balance: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getAccountById(accountId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', accountId)
    .single()

  if (error) throw error
  return data
}

// Transaction helpers
export async function getUserTransactions(userId: string, limit = 50) {
  const supabase = createClient()
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', userId)

  if (!accounts || accounts.length === 0) return []

  const accountIds = accounts.map((a) => a.id)

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .in('from_account_id', accountIds)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function createTransaction(
  fromAccountId: string,
  toAccountNumber: string,
  toBankCode: string,
  amount: number,
  narration?: string
) {
  const supabase = createClient()
  const referenceId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      from_account_id: fromAccountId,
      to_account_number: toAccountNumber,
      to_bank_code: toBankCode,
      amount,
      narration,
      reference_id: referenceId,
      status: 'completed',
    })
    .select()
    .single()

  if (error) throw error

  // Update account balance
  const account = await getAccountById(fromAccountId)
  if (account) {
    const newBalance = account.balance - amount
    await supabase
      .from('accounts')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', fromAccountId)
  }

  return data
}

export async function getTransactionById(transactionId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single()

  if (error) throw error
  return data
}

// Demo transfer helpers
export async function createDemoTransfer(userId: string, accountId: string, amount: number) {
  const supabase = createClient()
  const refundDate = new Date()
  refundDate.setDate(refundDate.getDate() + 7) // Auto-refund after 7 days

  const { data, error } = await supabase
    .from('demo_transfers')
    .insert({
      user_id: userId,
      account_id: accountId,
      amount,
      refund_date: refundDate.toISOString(),
    })
    .select()
    .single()

  if (error) throw error

  // Add balance to account
  const account = await getAccountById(accountId)
  if (account) {
    const newBalance = account.balance + amount
    await supabase
      .from('accounts')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', accountId)

    // Update profile demo balance
    await supabase
      .from('profiles')
      .update({
        demo_balance: (account.balance || 0) - amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
  }

  return data
}

export async function getDemoTransfers(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('demo_transfers')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}
