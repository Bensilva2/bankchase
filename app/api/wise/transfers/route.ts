import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getWiseClient } from '@/lib/wise/client';
import { handleWiseError } from '@/lib/wise/errors';
import * as db from '@/lib/wise/db';

export async function POST(request: NextRequest) {
  try {
    const wiseClient = getWiseClient();
    const body = await request.json();

    const {
      profileId,
      userId,
      quoteUuid,
      targetAccountId,
      sourceCurrency,
      targetCurrency,
      sourceAmount,
      targetAmount,
      exchangeRate,
      feeAmount,
      recipientAccountId,
      recipientName,
      recipientAccountNumber,
      recipientBank,
      details,
      customerTransactionId,
    } = body;

    // Validate required fields
    if (!profileId || !quoteUuid || !targetAccountId) {
      return NextResponse.json(
        { error: 'Missing required fields: profileId, quoteUuid, targetAccountId' },
        { status: 400 }
      );
    }

    // Generate idempotency key if not provided
    const idempotencyKey = customerTransactionId || uuidv4();

    // Create transfer in Wise
    const response = await wiseClient.createTransfer({
      profileId,
      quoteUuid,
      targetAccountId,
      customerTransactionId: idempotencyKey,
      details,
    });

    const wiseTransferData = response.data;

    // Store in database
    if (userId) {
      const dbTransfer = await db.createTransfer({
        wise_transfer_id: wiseTransferData.id,
        wise_quote_uuid: quoteUuid,
        user_id: userId,
        from_account_id: null,
        source_currency: sourceCurrency,
        target_currency: targetCurrency,
        source_amount: sourceAmount,
        target_amount: targetAmount,
        exchange_rate: exchangeRate,
        fee_amount: feeAmount,
        recipient_account_id: recipientAccountId,
        recipient_account_number: recipientAccountNumber,
        recipient_name: recipientName,
        recipient_bank: recipientBank,
        status: wiseTransferData.status || 'pending',
        customer_transaction_id: idempotencyKey,
        metadata: wiseTransferData,
        webhook_events: [],
      });

      return NextResponse.json({
        id: dbTransfer.id,
        wiseId: wiseTransferData.id,
        status: dbTransfer.status,
        ...wiseTransferData,
      }, { status: 201 });
    }

    return NextResponse.json(wiseTransferData, { status: 201 });
  } catch (error) {
    const wiseError = handleWiseError(error);
    return NextResponse.json(
      {
        error: wiseError.errorCode,
        message: wiseError.message,
        details: wiseError.details,
      },
      { status: wiseError.statusCode }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    const { transfers, total } = await db.getUserTransfers(userId, limit, offset);
    return NextResponse.json({ transfers, total, limit, offset });
  } catch (error) {
    console.error('Error fetching transfers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transfers' },
      { status: 500 }
    );
  }
}
