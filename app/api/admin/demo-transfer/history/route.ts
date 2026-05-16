import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminUserId = searchParams.get('adminUserId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!adminUserId) {
      return NextResponse.json(
        { error: 'Admin user ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('demo_transfers')
      .select('*', { count: 'exact' })
      .eq('admin_user_id', adminUserId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: transfers, count, error } = await query;

    if (error) {
      console.error('[v0] Error fetching demo transfers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transfers' },
        { status: 500 }
      );
    }

    // Get account details for each transfer
    const transfersWithDetails = await Promise.all(
      (transfers || []).map(async (transfer) => {
        const { data: fromAccount } = await supabase
          .from('demo_accounts')
          .select('balance')
          .eq('id', transfer.from_account_id)
          .single();

        const { data: toAccount } = await supabase
          .from('demo_accounts')
          .select('balance, user_id')
          .eq('account_number', transfer.to_account_number)
          .single();

        return {
          ...transfer,
          fromAccountBalance: fromAccount?.balance || 0,
          toAccountBalance: toAccount?.balance || 0,
          isInternal: toAccount?.user_id !== null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      transfers: transfersWithDetails,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[v0] Error fetching transfer history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transfer history' },
      { status: 500 }
    );
  }
}
