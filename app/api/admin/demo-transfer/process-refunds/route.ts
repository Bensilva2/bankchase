import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    // Verify request is from a trusted source (Vercel Cron, internal service, etc.)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'demo-cron-secret'}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find all expired pending demo transfers
    const { data: expiredTransfers, error: queryError } = await supabase
      .from('demo_transfers')
      .select('*')
      .eq('status', 'pending')
      .lte('expires_at', new Date().toISOString());

    if (queryError) {
      console.error('[v0] Error fetching expired transfers:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch expired transfers' },
        { status: 500 }
      );
    }

    if (!expiredTransfers || expiredTransfers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired transfers to refund',
        refundedCount: 0,
      });
    }

    let refundedCount = 0;

    for (const transfer of expiredTransfers) {
      try {
        // Get admin account
        const { data: adminAccount, error: adminError } = await supabase
          .from('demo_accounts')
          .select('*')
          .eq('id', transfer.from_account_id)
          .single();

        if (!adminAccount) {
          console.error(`[v0] Admin account not found for transfer ${transfer.id}`);
          continue;
        }

        // Get receiver account
        const { data: receiverAccount, error: receiverError } = await supabase
          .from('demo_accounts')
          .select('*')
          .eq('account_number', transfer.to_account_number)
          .single();

        // Refund admin
        const newAdminBalance = (adminAccount.balance || 0) + transfer.amount;
        await supabase
          .from('demo_accounts')
          .update({ balance: newAdminBalance })
          .eq('id', transfer.from_account_id);

        // Deduct from receiver (if account exists and has funds)
        if (receiverAccount) {
          const newReceiverBalance = Math.max(0, (receiverAccount.balance || 0) - transfer.amount);
          await supabase
            .from('demo_accounts')
            .update({ balance: newReceiverBalance })
            .eq('id', receiverAccount.id);
        }

        // Update transfer status to refunded
        const { error: updateError } = await supabase
          .from('demo_transfers')
          .update({
            status: 'refunded',
            refunded_at: new Date().toISOString(),
          })
          .eq('id', transfer.id);

        if (updateError) {
          console.error(`[v0] Error updating transfer ${transfer.id}:`, updateError);
          continue;
        }

        refundedCount++;
        console.log(`[v0] Refunded transfer ${transfer.transfer_reference} for amount ${transfer.amount}`);
      } catch (error) {
        console.error(`[v0] Error processing refund for transfer ${transfer.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${refundedCount} expired demo transfers`,
      refundedCount,
      totalExpired: expiredTransfers.length,
    });
  } catch (error) {
    console.error('[v0] Demo refund job error:', error);
    return NextResponse.json(
      { error: 'Failed to process demo refunds' },
      { status: 500 }
    );
  }
}
