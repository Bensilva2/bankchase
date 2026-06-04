import { NextRequest, NextResponse } from 'next/server';
import { getWiseClient } from '@/lib/wise/client';
import { handleWiseError } from '@/lib/wise/errors';
import * as db from '@/lib/wise/db';

export async function POST(request: NextRequest) {
  try {
    const wiseClient = getWiseClient();
    const body = await request.json();

    const {
      profileId,
      accountHolderName,
      currency,
      details,
      userId,
    } = body;

    // Validate required fields
    if (!profileId || !accountHolderName || !currency || !details) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create recipient in Wise
    const response = await wiseClient.createRecipient({
      profileId,
      accountHolderName,
      currency,
      details,
    });

    const wiseRecipientData = response.data;

    // Store in database
    if (userId) {
      const dbRecipient = await db.createRecipient({
        user_id: userId,
        wise_recipient_id: wiseRecipientData.id,
        account_holder_name: accountHolderName,
        currency,
        account_number: details.accountNumber || null,
        account_type: details.accountType || null,
        bank_code: details.bankCode || null,
        bank_name: details.bankName || null,
        bank_details: details,
        is_active: true,
        metadata: wiseRecipientData,
      });

      return NextResponse.json({
        id: dbRecipient.id,
        wiseId: wiseRecipientData.id,
        ...wiseRecipientData,
      });
    }

    return NextResponse.json(wiseRecipientData);
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
    const currency = request.nextUrl.searchParams.get('currency');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    const recipients = await db.getUserRecipients(userId, currency || undefined);
    return NextResponse.json({ recipients });
  } catch (error) {
    console.error('Error fetching recipients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipients' },
      { status: 500 }
    );
  }
}
