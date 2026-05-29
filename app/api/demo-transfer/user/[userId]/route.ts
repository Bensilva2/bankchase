import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // For now, return mock data since we're using localStorage
    // In production, this would query the Supabase demo_transfers table
    const mockTransfers = [
      {
        id: '1',
        transfer_reference: 'DEMO-ABC12345',
        amount: 5000,
        status: 'completed' as const,
        transfer_type: 'internal' as const,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        from_account_number: 'ADMIN-001',
      },
      {
        id: '2',
        transfer_reference: 'DEMO-DEF67890',
        amount: 10000,
        status: 'pending' as const,
        transfer_type: 'external' as const,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        refund_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        daysUntilRefund: 5,
        from_account_number: 'ADMIN-001',
      },
      {
        id: '3',
        transfer_reference: 'DEMO-GHI13579',
        amount: 2500,
        status: 'completed' as const,
        transfer_type: 'internal' as const,
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        from_account_number: 'ADMIN-001',
      },
    ];

    // Filter to this user's transfers and calculate days until refund
    const userTransfers = mockTransfers.map(t => ({
      ...t,
      daysUntilRefund: t.status === 'pending' && t.refund_date
        ? Math.max(0, Math.ceil((new Date(t.refund_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : undefined,
    }));

    return NextResponse.json({
      success: true,
      transfers: userTransfers,
      stats: {
        totalReceived: userTransfers
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0),
        pendingRefunds: userTransfers.filter(t => t.status === 'pending').length,
        completedCount: userTransfers.filter(t => t.status === 'completed').length,
      },
    });
  } catch (error) {
    console.error('[v0] Error fetching user demo transfers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transfers' },
      { status: 500 }
    );
  }
}
