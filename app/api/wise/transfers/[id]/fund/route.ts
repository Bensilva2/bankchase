import { NextRequest, NextResponse } from 'next/server';
import { getWiseClient } from '@/lib/wise/client';
import { handleWiseError } from '@/lib/wise/errors';
import * as db from '@/lib/wise/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const wiseClient = getWiseClient();
    const transferId = params.id;
    const body = await request.json();

    const { type = 'BALANCE' } = body;

    // Fund the transfer in Wise
    const response = await wiseClient.fundTransfer(transferId, { type });

    // Update transfer status in database
    try {
      const dbTransfer = await db.getTransferByWiseId(transferId);
      await db.updateTransfer(dbTransfer.id, {
        funded_at: new Date().toISOString(),
        status: 'processing',
      });
    } catch (dbError) {
      console.error('Failed to update transfer status in database:', dbError);
      // Continue anyway - the transfer was funded in Wise
    }

    return NextResponse.json(response.data);
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const wiseClient = getWiseClient();
    const transferId = params.id;

    const response = await wiseClient.getTransfer(transferId);
    return NextResponse.json(response.data);
  } catch (error) {
    const wiseError = handleWiseError(error);
    return NextResponse.json(
      {
        error: wiseError.errorCode,
        message: wiseError.message,
      },
      { status: wiseError.statusCode }
    );
  }
}
