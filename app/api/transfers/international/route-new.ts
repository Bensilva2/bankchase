import { NextRequest, NextResponse } from 'next/server';
import { PaymentProviderFactory } from '@/lib/payment-provider-factory';
import { TransactionLedgerService } from '@/lib/transaction-ledger-service';
import { publishTransactionEvent } from '@/lib/event-emitter';
import { updateTransactionStatus } from '@/lib/transaction-tracker';
import { SecurityMiddleware } from '@/lib/security-middleware';
import { idempotencyManager } from '@/lib/idempotency-manager';

/**
 * POST /api/transfers/international
 * 
 * Handles international cross-border transfers with payment provider integration
 * 
 * Required Headers:
 * - Idempotency-Key: Unique request identifier
 * - Authorization: Bearer {apiKey}
 * 
 * Request body:
 * {
 *   senderId: string,
 *   senderAccountNumber: string,
 *   receiverName: string,
 *   receiverAccountNumber: string,
 *   receiverBankCode: string,
 *   receiverCountry: string,
 *   amount: number,
 *   fromCurrency: string,
 *   toCurrency: string,
 *   paymentProvider: 'currencycloud' | 'swift' | 'thunes',
 *   reference?: string,
 *   senderPhone?: string
 * }
 */
export async function POST(request: NextRequest) {
  // Validate idempotency
  const idempotencyValidation = await SecurityMiddleware.validateIdempotency(request);
  if (!idempotencyValidation.valid) {
    return NextResponse.json(
      { error: idempotencyValidation.error },
      { status: idempotencyValidation.statusCode }
    );
  }

  if (idempotencyValidation.cached) {
    return NextResponse.json(idempotencyValidation.response, { status: 200 });
  }

  const idempotencyKey = idempotencyValidation.idempotencyKey as string;

  try {
    const body = await request.json();
    const {
      senderId,
      senderAccountNumber,
      receiverName,
      receiverAccountNumber,
      receiverBankCode,
      receiverCountry,
      amount,
      fromCurrency,
      toCurrency,
      paymentProvider = 'currencycloud',
      reference,
      senderPhone,
    } = body;

    // Validation
    const requiredFields = [
      'senderId',
      'senderAccountNumber',
      'receiverName',
      'receiverAccountNumber',
      'receiverBankCode',
      'amount',
      'fromCurrency',
      'toCurrency',
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        await idempotencyManager.releaseProcessing(idempotencyKey);
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    if (amount <= 0) {
      await idempotencyManager.releaseProcessing(idempotencyKey);
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      );
    }

    // Generate transaction ID
    const transactionId = `INTL-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    console.log(
      `[InternationalTransferAPI] Processing ${transactionId} via ${paymentProvider}`
    );

    // Get payment provider
    let provider;
    try {
      provider = PaymentProviderFactory.getProvider(paymentProvider);
    } catch (err) {
      await idempotencyManager.releaseProcessing(idempotencyKey);
      return NextResponse.json(
        { error: `Invalid payment provider: ${paymentProvider}` },
        { status: 400 }
      );
    }

    // Step 1: Get exchange rate quote
    console.log(`[InternationalTransferAPI] Fetching exchange rate...`);
    const rateQuote = await provider.getExchangeRate({
      fromCurrency,
      toCurrency,
      amount,
    });

    // Step 2: Record transaction in ledger
    const ledgerResult = await TransactionLedgerService.recordTransaction({
      transaction_id: transactionId,
      sender_account_id: senderId,
      receiver_account_id: receiverAccountNumber,
      amount,
      currency: fromCurrency,
      transaction_type: 'transfer',
      status: 'validating',
      idempotency_key: idempotencyKey,
      provider_name: paymentProvider,
      metadata: {
        receiverName,
        receiverCountry,
        targetCurrency: toCurrency,
        exchangeRate: rateQuote.rate,
        convertedAmount: rateQuote.convertedAmount,
        estimatedFee: rateQuote.fee,
      },
    });

    if (!ledgerResult.success) {
      await idempotencyManager.releaseProcessing(idempotencyKey);
      return NextResponse.json(
        { error: 'Failed to record transaction' },
        { status: 500 }
      );
    }

    // Step 3: Update status to processing
    await updateTransactionStatus(transactionId, 'processing', {
      step: 'initiating_with_provider',
      provider: paymentProvider,
    });

    // Step 4: Initiate transfer with payment provider
    console.log(`[InternationalTransferAPI] Initiating transfer with provider...`);
    const transferResponse = await provider.initiateTransfer({
      senderAccountId: senderAccountNumber,
      receiverAccountId: receiverAccountNumber,
      receiverBankCode,
      amount,
      currency: fromCurrency,
      reference: reference || transactionId,
      idempotencyKey,
    });

    if (!transferResponse.success) {
      // Update transaction status to failed
      await TransactionLedgerService.updateTransactionStatus(
        transactionId,
        'failed',
        transferResponse.error || 'Provider transfer failed'
      );

      await publishTransactionEvent('transfer.failed', {
        transactionId,
        senderId,
        receiverAccount: receiverAccountNumber,
        amount,
        currency: fromCurrency,
        timestamp: Date.now(),
        error: transferResponse.error,
      });

      await idempotencyManager.releaseProcessing(idempotencyKey);

      return NextResponse.json(
        {
          status: 'failed',
          error: transferResponse.error,
          transactionId,
        },
        { status: 402 }
      );
    }

    // Step 5: Update transaction with provider reference
    await TransactionLedgerService.updateTransactionStatus(
      transactionId,
      'processing',
      'Provider accepted transfer'
    );

    // Step 6: Publish event (triggers SMS alert)
    await publishTransactionEvent('transfer.initiated', {
      transactionId,
      senderId,
      receiverAccount: receiverAccountNumber,
      amount,
      currency: fromCurrency,
      timestamp: Date.now(),
      senderPhone,
      metadata: {
        provider: paymentProvider,
        providerId: transferResponse.providerId,
        convertedAmount: rateQuote.convertedAmount,
        targetCurrency: toCurrency,
        rate: rateQuote.rate,
      },
    });

    // Step 7: Cache and return response
    const successResponse = {
      status: 'success',
      message: 'International transfer initiated',
      transactionId,
      providerId: transferResponse.providerId,
      providerStatus: transferResponse.status,
      exchangeRate: rateQuote.rate,
      estimatedConvertedAmount: rateQuote.convertedAmount,
      estimatedFee: rateQuote.fee,
      timestamp: new Date().toISOString(),
    };

    await idempotencyManager.cacheResponse(idempotencyKey, successResponse);
    await idempotencyManager.releaseProcessing(idempotencyKey);

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error('[InternationalTransferAPI] Error:', error);
    await idempotencyManager.releaseProcessing(idempotencyKey);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/transfers/international/rates
 * 
 * Get current exchange rates (for UI display)
 */
export async function GET(request: NextRequest) {
  try {
    const fromCurrency = request.nextUrl.searchParams.get('from');
    const toCurrency = request.nextUrl.searchParams.get('to');
    const amount = request.nextUrl.searchParams.get('amount');

    if (!fromCurrency || !toCurrency || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters: from, to, amount' },
        { status: 400 }
      );
    }

    const provider = PaymentProviderFactory.getDefaultProvider();
    const rateQuote = await provider.getExchangeRate({
      fromCurrency,
      toCurrency,
      amount: parseFloat(amount),
    });

    return NextResponse.json(rateQuote, { status: 200 });
  } catch (error) {
    console.error('[InternationalTransferAPI] Rate lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rate' },
      { status: 500 }
    );
  }
}
