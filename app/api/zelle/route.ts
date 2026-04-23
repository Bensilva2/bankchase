/**
 * Zelle API - Peer-to-peer transfers via email or phone
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/zelle - Get Zelle contacts and transfer history
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const userId = request.headers.get('x-user-id')
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'contacts' // 'contacts' | 'history'

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (type === 'contacts') {
      // Get saved Zelle contacts
      const { data: contacts } = await supabase
        .from('zelle_contacts')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true })

      return NextResponse.json({
        contacts: contacts || [],
        count: contacts?.length || 0
      })
    }

    if (type === 'history') {
      // Get Zelle transfer history
      const { data: transfers } = await supabase
        .from('zelle_transfers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      return NextResponse.json({
        transfers: transfers || [],
        count: transfers?.length || 0
      })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('[v0] Zelle fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Zelle data' },
      { status: 500 }
    )
  }
}

// POST /api/zelle - Send Zelle transfer or add contact
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const userId = request.headers.get('x-user-id')
    const {
      action, // 'send' | 'add_contact'
      fromAccountId,
      amount,
      recipientEmail,
      recipientPhone,
      recipientName,
      memoMessage,
      saveContact,
    } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (action === 'send') {
      if (!fromAccountId || !amount || (!recipientEmail && !recipientPhone)) {
        return NextResponse.json(
          { error: 'Missing required fields for transfer' },
          { status: 400 }
        )
      }

      const numAmount = parseFloat(amount)
      if (numAmount <= 0 || numAmount > 5000) {
        return NextResponse.json(
          { error: 'Amount must be between $0.01 and $5,000' },
          { status: 400 }
        )
      }

      // Verify account
      const { data: account } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', fromAccountId)
        .eq('user_id', userId)
        .single()

      if (!account || account.balance < numAmount) {
        return NextResponse.json(
          { error: 'Insufficient funds' },
          { status: 400 }
        )
      }

      // Create Zelle transfer
      const { data: transfer } = await supabase
        .from('zelle_transfers')
        .insert([
          {
            user_id: userId,
            from_account_id: fromAccountId,
            amount: numAmount,
            recipient_email: recipientEmail,
            recipient_phone: recipientPhone,
            recipient_name: recipientName,
            memo: memoMessage,
            status: 'sent',
            created_at: new Date().toISOString(),
          }
        ])
        .select()

      // Create transaction
      await supabase.from('transactions').insert([
        {
          user_id: userId,
          account_id: fromAccountId,
          type: 'debit',
          description: `Zelle to ${recipientName || recipientEmail || recipientPhone}`,
          amount: numAmount,
          category: 'zelle',
          status: 'completed',
          created_at: new Date().toISOString(),
        }
      ])

      // Update account balance
      await supabase
        .from('accounts')
        .update({ balance: account.balance - numAmount })
        .eq('id', fromAccountId)

      // Save contact if requested
      if (saveContact && recipientName) {
        await supabase.from('zelle_contacts').insert([
          {
            user_id: userId,
            name: recipientName,
            email: recipientEmail,
            phone: recipientPhone,
            created_at: new Date().toISOString(),
          }
        ])
      }

      return NextResponse.json({
        message: 'Zelle transfer sent successfully',
        transferId: transfer?.[0]?.id,
        recipient: recipientName || recipientEmail,
        amount: numAmount,
        delivery: 'Usually arrives within minutes'
      })
    }

    if (action === 'add_contact') {
      if (!recipientName || (!recipientEmail && !recipientPhone)) {
        return NextResponse.json(
          { error: 'Name and email/phone required' },
          { status: 400 }
        )
      }

      const { data: contact } = await supabase
        .from('zelle_contacts')
        .insert([
          {
            user_id: userId,
            name: recipientName,
            email: recipientEmail,
            phone: recipientPhone,
            created_at: new Date().toISOString(),
          }
        ])
        .select()

      return NextResponse.json({
        message: 'Contact added to Zelle',
        contact: contact[0]
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[v0] Zelle error:', error)
    return NextResponse.json(
      { error: 'Failed to process Zelle request' },
      { status: 500 }
    )
  }
}

// DELETE /api/zelle - Remove Zelle contact
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const userId = request.headers.get('x-user-id')
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')

    if (!userId || !contactId) {
      return NextResponse.json({ error: 'Unauthorized or missing contactId' }, { status: 401 })
    }

    // Verify contact belongs to user
    const { data: contact } = await supabase
      .from('zelle_contacts')
      .select('id')
      .eq('id', contactId)
      .eq('user_id', userId)
      .single()

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Delete contact
    const { error } = await supabase
      .from('zelle_contacts')
      .delete()
      .eq('id', contactId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      message: 'Contact removed from Zelle'
    })
  } catch (error) {
    console.error('[v0] Delete contact error:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    )
  }
}
