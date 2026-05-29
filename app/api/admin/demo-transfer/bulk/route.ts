import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { amount, daysToRefund = 7, adminUserId } = await request.json();

    // Validate inputs
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get admin's demo account
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

    // Get all registered users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(10000);

    if (usersError || !users || users.length === 0) {
      return NextResponse.json(
        { error: 'No users found' },
        { status: 400 }
      );
    }

    const totalAmount = amount * users.length;
    if ((adminAccount?.balance || 1000000) < totalAmount) {
      return NextResponse.json(
        { error: 'Insufficient demo balance for bulk transfer' },
        { status: 400 }
      );
    }

    // Process transfers for each user
    const transfers = [];
    let newAdminBalance = (adminAccount?.balance || 1000000) - totalAmount;

    for (const user of users) {
      // Get or create user's demo account
      const { data: userDemoAccount } = await supabase
        .from('demo_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_demo_account', true)
        .single();

      let userAccountId = userDemoAccount?.id;

      if (!userDemoAccount) {
        const { data: newUserAccount, error: createError } = await supabase
          .from('demo_accounts')
          .insert({
            account_number: `USER-${user.id.slice(0, 12).toUpperCase()}`,
            user_id: user.id,
            balance: amount,
            is_demo_account: true,
            account_type: 'demo',
          })
          .select()
          .single();

        if (createError) {
          console.error('[v0] Error creating user demo account:', createError);
          continue;
        }

        userAccountId = newUserAccount?.id;
      } else {
        // Update existing account balance
        await supabase
          .from('demo_accounts')
          .update({ balance: (userDemoAccount.balance || 0) + amount })
          .eq('id', userAccountId);
      }

      // Create transfer record
      const transferReference = `BULK-${uuidv4().slice(0, 8).toUpperCase()}`;
      const { data: transfer } = await supabase
        .from('demo_transfers')
        .insert({
          transfer_reference: transferReference,
          admin_user_id: adminUserId,
          from_account_id: adminAccountId,
          to_account_number: userDemoAccount?.account_number || `USER-${user.id.slice(0, 12).toUpperCase()}`,
          to_user_id: user.id,
          amount: parseFloat(amount),
          status: 'completed',
          transfer_type: 'internal',
        })
        .select()
        .single();

      if (transfer) {
        transfers.push(transfer);
      }
    }

    // Update admin account balance
    await supabase
      .from('demo_accounts')
      .update({ balance: newAdminBalance })
      .eq('id', adminAccountId);

    return NextResponse.json({
      success: true,
      message: `Successfully sent ${amount} demo money to ${users.length} users`,
      totalUsers: users.length,
      totalAmountSent: totalAmount,
      transfersCreated: transfers.length,
    });
  } catch (error) {
    console.error('[v0] Bulk demo transfer error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk demo transfer' },
      { status: 500 }
    );
  }
}
