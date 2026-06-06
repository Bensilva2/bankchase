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
    const { publicToken, metadata } = await request.json();

    if (!publicToken) {
      return NextResponse.json(
        { error: 'publicToken is required' },
        { status: 400 }
      );
    }

    // Exchange public token for access token
    const exchangeResult = await PlaidService.exchangePublicToken(publicToken);

    // Get accounts for this item
    const accountsResult = await PlaidService.getAccounts(exchangeResult.accessToken);

    // Save each account to database
    for (const account of accountsResult.accounts) {
      await PlaidService.saveAccount(
        userId,
        exchangeResult.itemId,
        exchangeResult.accessToken,
        accountsResult.item.institutionId,
        {
          accountId: account.accountId,
          name: account.name,
          mask: account.mask,
          type: account.type,
          subtype: account.subtype,
          balances: account.balances,
          institutionName: metadata?.institutionName || 'Bank',
        }
      );
    }

    // Get transactions for the last 30 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const transactionsResult = await PlaidService.getTransactions(
      exchangeResult.accessToken,
      startDate,
      endDate
    );

    console.log(`[v0] Retrieved ${transactionsResult.transactions.length} transactions`);

    return NextResponse.json({
      success: true,
      itemId: exchangeResult.itemId,
      accountCount: accountsResult.accounts.length,
      transactionCount: transactionsResult.transactions.length,
    });
  } catch (error: any) {
    console.error('[v0] Error exchanging token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to exchange token' },
      { status: 500 }
    );
  }
}
