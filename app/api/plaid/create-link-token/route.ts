import { NextRequest, NextResponse } from 'next/server';
import { PlaidService } from '@/lib/plaid-service';

export async function POST(request: NextRequest) {
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
    const linkToken = await PlaidService.createLinkToken(userId);

    return NextResponse.json(linkToken);
  } catch (error: any) {
    console.error('[v0] Error creating link token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create link token' },
      { status: 500 }
    );
  }
}
