import { NextRequest, NextResponse } from 'next/server';
import { PlaidService } from '@/lib/plaid-service';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = (payload as any).userId || (payload as any).sub;
    const accounts = await PlaidService.getUserAccounts(userId);

    return NextResponse.json({
      accounts,
      count: accounts.length,
    });
  } catch (error: any) {
    console.error('[v0] Error fetching accounts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}
