import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { toAccountNumber, amount, daysToRefund = 7, adminUserId } = await request.json();

    // Validate inputs
    if (!toAccountNumber || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid account number or amount' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get or create admin's demo account
    const { data: adminAccount, error: adminAccountError } = await supabase
      .from('demo_accounts')
      .select('*')
      .eq('user_id', adminUserId)
      .eq('is_demo_account', true)
      .single();

    let adminAccountId = adminAccount?.id;

    if (!adminAccount) {
      const { data: newAdminAccount, error: createError } = await supabase
        .from('demo_accounts')
        .insert({
          account_number: `DEMO-ADMIN-${adminUserId.slice(0, 8).toUpperCase()}`,
          user_id: adminUserId,
          balance: 1000000.00,
          is_demo_account: true,
          account_type: 'demo',
        })
        .select()
        .single();

      if (createError) {
        console.error('[v0] Error creating admin demo account:', createError);
        return NextResponse.json(
          { error: 'Failed to create admin account' },
          { status: 500 }
        );
      }

      adminAccountId = newAdminAccount?.id;
    }

    // Check admin balance
    if (adminAccount && adminAccount.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient demo balance in admin account' },
        { status: 400 }
      );
    }

    // Find destination account
    const { data: destinationAccount } = await supabase
      .from('demo_accounts')
      .select('*')
      .eq('account_number', toAccountNumber)
      .single();

    const isInternal = destinationAccount?.user_id !== null && destinationAccount !== null;

    let destinationAccountId = destinationAccount?.id;

    if (!destinationAccount) {
      // Create external account
      const { data: newDestAccount, error: createDestError } = await supabase
        .from('demo_accounts')
        .insert({
          account_number: toAccountNumber,
          user_id: null,
          balance: 0.00,
          is_demo_account: true,
          account_type: 'demo',
        })
        .select()
        .single();

      if (createDestError) {
        console.error('[v0] Error creating destination account:', createDestError);
        return NextResponse.json(
          { error: 'Failed to create destination account' },
          { status: 500 }
        );
      }

      destinationAccountId = newDestAccount?.id;
    }

    // Create transfer record
    const transferReference = `DEMO-${uuidv4().slice(0, 8).toUpperCase()}`;
    const expiresAt = !isInternal 
      ? new Date(Date.now() + daysToRefund * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data: transfer, error: transferError } = await supabase
      .from('demo_transfers')
      .insert({
        transfer_reference: transferReference,
        admin_user_id: adminUserId,
        from_account_id: adminAccountId,
        to_account_number: toAccountNumber,
        to_user_id: destinationAccount?.user_id || null,
        amount: parseFloat(amount),
        status: isInternal ? 'completed' : 'pending',
        transfer_type: isInternal ? 'internal' : 'external',
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (transferError) {
      console.error('[v0] Error creating transfer:', transferError);
      return NextResponse.json(
        { error: 'Failed to create transfer' },
        { status: 500 }
      );
    }

    // Update balances
    const { error: updateAdminError } = await supabase
      .from('demo_accounts')
      .update({ balance: (adminAccount?.balance || 1000000) - amount })
      .eq('id', adminAccountId);

    if (updateAdminError) {
      console.error('[v0] Error updating admin balance:', updateAdminError);
    }

    const { error: updateDestError } = await supabase
      .from('demo_accounts')
      .update({
        balance: (destinationAccount?.balance || 0) + amount,
      })
      .eq('id', destinationAccountId);

    if (updateDestError) {
      console.error('[v0] Error updating destination balance:', updateDestError);
    }

    return NextResponse.json({
      success: true,
      transferId: transfer?.id,
      transferReference,
      status: transfer?.status,
      toAccount: toAccountNumber,
      amount,
      willRefundIn: !isInternal ? `${daysToRefund} days` : null,
      message: 'Demo transfer successful',
    });
  } catch (error) {
    console.error('[v0] Demo transfer error:', error);
    return NextResponse.json(
      { error: 'Failed to process demo transfer' },
      { status: 500 }
    );
  }
}
