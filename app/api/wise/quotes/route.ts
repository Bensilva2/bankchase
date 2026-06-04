import { NextRequest, NextResponse } from 'next/server';
import { getWiseClient } from '@/lib/wise/client';
import { handleWiseError } from '@/lib/wise/errors';

export async function POST(request: NextRequest) {
  try {
    const wiseClient = getWiseClient();
    const body = await request.json();

    const {
      profileId,
      sourceCurrency,
      targetCurrency,
      sourceAmount,
      targetAmount,
    } = body;

    // Validate required fields
    if (!profileId || !sourceCurrency || !targetCurrency) {
      return NextResponse.json(
        { error: 'Missing required fields: profileId, sourceCurrency, targetCurrency' },
        { status: 400 }
      );
    }

    if (!sourceAmount && !targetAmount) {
      return NextResponse.json(
        { error: 'Either sourceAmount or targetAmount is required' },
        { status: 400 }
      );
    }

    const response = await wiseClient.createQuote({
      profileId,
      sourceCurrency,
      targetCurrency,
      sourceAmount,
      targetAmount,
    });

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

export async function GET(request: NextRequest) {
  try {
    const wiseClient = getWiseClient();
    const quoteId = request.nextUrl.searchParams.get('quoteId');

    if (!quoteId) {
      return NextResponse.json(
        { error: 'quoteId query parameter is required' },
        { status: 400 }
      );
    }

    const response = await wiseClient.getQuote(quoteId);
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
