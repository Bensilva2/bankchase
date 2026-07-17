import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/server';

/**
 * Real-time Transfer API with Balance Synchronization
 * POST /api/transfers/realtime
 * 
 * Handles instant money transfers with real-time balance updates
 * Supports both internal and external bank transfers
 */

interface TransferPayload {
  userId: string;
  fromAccountId: string;
  toAccountNumber: string;
  toBankCode: string;
  amount: number;
  recipientName: string;
  narration?: string;
}

interface BankDetails {
  accountNumber: string;
  bankCode: string;
  routingNumber?: string;
  swiftCode?: string;
}

interface TransferResponse {
  success: boolean;
  transaction: {
    id: string;
    status: 'processing' | 'completed' | 'failed';
    transactionId: string;
    amount: number;
    fromAccount: string;
    toAccount: string;
    recipientName: string;
    timestamp: string;
    estimatedDelivery?: string;
  };
  status: string;
  error?: string;
}

// In-memory transfer tracking (in production, use a real database)
const transferTracking = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as TransferPayload;
    const { fromAccountId, toAccountNumber, toBankCode, amount, recipientName, narration } = body;

    // Validation
    if (!fromAccountId || !toAccountNumber || !toBankCode || !amount || !recipientName) {
      return NextResponse.json(
        { error: 'Missing required fields: fromAccountId, toAccountNumber, toBankCode, amount, recipientName' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }

    if (amount > 1000000) {
      return NextResponse.json({ error: 'Amount exceeds maximum limit' }, { status: 400 });
    }

    const transactionId = uuidv4();
    const timestamp = new Date().toISOString();

    console.log('[v0] Transfer started:', {
      transactionId,
      userId: user.id,
      amount,
      fromAccountId,
      toAccountNumber,
      recipientName
    });

    try {
      // Fetch sender's account
      const { data: senderAccount, error: senderError } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', fromAccountId)
        .eq('user_id', user.id)
        .single();

      if (senderError || !senderAccount) {
        console.error('[v0] Sender account not found:', senderError);
        return NextResponse.json({ error: 'Sender account not found' }, { status: 404 });
      }

      // Check balance
      if (senderAccount.balance < amount) {
        console.error('[v0] Insufficient balance:', { 
          required: amount, 
          available: senderAccount.balance 
        });
        return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
      }

      // Begin transaction
      console.log('[v0] Beginning balance update...');

      // 1. Deduct from sender account
      const { data: updatedSender, error: deductError } = await supabase
        .from('accounts')
        .update({
          balance: senderAccount.balance - amount,
          updated_at: timestamp
        })
        .eq('id', fromAccountId)
        .eq('user_id', user.id)
        .select('balance')
        .single();

      if (deductError) {
        console.error('[v0] Failed to deduct from sender:', deductError);
        throw new Error('Failed to process debit');
      }

      console.log('[v0] Sender balance updated:', {
        from: senderAccount.balance,
        to: updatedSender.balance,
        deducted: amount
      });

      // 2. Find or create receiver account
      let receiverAccount: any = null;

      if (toBankCode === 'INTERNAL') {
        // Internal transfer - find recipient by account number
        const { data: recipient, error: recipientError } = await supabase
          .from('accounts')
          .select('*')
          .eq('account_number', toAccountNumber)
          .single();

        if (recipientError || !recipient) {
          console.error('[v0] Recipient account not found:', recipientError);
          
          // Rollback deduction
          await supabase
            .from('accounts')
            .update({ balance: senderAccount.balance })
            .eq('id', fromAccountId);

          return NextResponse.json({ error: 'Recipient account not found' }, { status: 404 });
        }

        receiverAccount = recipient;

        // Add funds to recipient
        const { data: updatedRecipient, error: creditError } = await supabase
          .from('accounts')
          .update({
            balance: receiverAccount.balance + amount,
            updated_at: timestamp
          })
          .eq('id', receiverAccount.id)
          .select('balance')
          .single();

        if (creditError) {
          console.error('[v0] Failed to credit recipient:', creditError);
          
          // Rollback deduction
          await supabase
            .from('accounts')
            .update({ balance: senderAccount.balance })
            .eq('id', fromAccountId);

          throw new Error('Failed to process credit');
        }

        console.log('[v0] Recipient balance updated:', {
          from: receiverAccount.balance,
          to: updatedRecipient.balance,
          added: amount
        });
      }

      // 3. Create transaction record
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          id: transactionId,
          user_id: user.id,
          from_account_id: fromAccountId,
          to_account_number: toAccountNumber,
          to_bank_code: toBankCode,
          to_bank_name: getBankName(toBankCode),
          amount,
          currency: 'USD',
          status: 'completed',
          transaction_type: 'transfer',
          recipient_name: recipientName,
          description: narration || `Transfer to ${recipientName}`,
          initiated_at: timestamp,
          completed_at: timestamp,
          metadata: {
            transactionId,
            recipientName,
            bankCode: toBankCode,
            accountNumber: toAccountNumber
          }
        })
        .select('*')
        .single();

      if (txError) {
        console.error('[v0] Failed to create transaction record:', txError);
        throw new Error('Failed to record transaction');
      }

      console.log('[v0] Transaction recorded:', transactionId);

      // 4. Create receiver transaction record (if internal transfer)
      if (toBankCode === 'INTERNAL' && receiverAccount) {
        const { error: rxError } = await supabase
          .from('transactions')
          .insert({
            id: uuidv4(),
            user_id: receiverAccount.user_id,
            from_account_id: fromAccountId,
            to_account_id: receiverAccount.id,
            amount,
            currency: 'USD',
            status: 'completed',
            transaction_type: 'deposit',
            description: `Received from ${senderAccount.account_number}`,
            initiated_at: timestamp,
            completed_at: timestamp,
            metadata: {
              originalTransactionId: transactionId,
              senderAccountNumber: senderAccount.account_number
            }
          });

        if (rxError) {
          console.error('[v0] Failed to create receiver transaction:', rxError);
        }
      }

      // 5. Calculate estimated delivery time
      const estimatedDelivery = new Date(Date.now() + (toBankCode === 'INTERNAL' ? 0 : 1000 * 60 * 60 * 24)).toISOString();

      // Track transfer for real-time updates
      transferTracking.set(transactionId, {
        status: 'completed',
        amount,
        fromAccount: fromAccountId,
        toAccount: toAccountNumber,
        recipientName,
        timestamp,
        completedAt: new Date().toISOString()
      });

      const response: TransferResponse = {
        success: true,
        transaction: {
          id: transaction.id,
          status: 'completed',
          transactionId,
          amount,
          fromAccount: senderAccount.account_number,
          toAccount: toAccountNumber,
          recipientName,
          timestamp,
          estimatedDelivery: toBankCode === 'INTERNAL' ? timestamp : estimatedDelivery
        },
        status: 'completed'
      };

      console.log('[v0] Transfer completed successfully:', response);

      return NextResponse.json(response, { status: 200 });

    } catch (error: any) {
      console.error('[v0] Transfer processing error:', error);

      // Attempt rollback
      try {
        const { data: currentAccount } = await supabase
          .from('accounts')
          .select('balance')
          .eq('id', fromAccountId)
          .single();

        if (currentAccount) {
          await supabase
            .from('accounts')
            .update({ balance: currentAccount.balance + amount })
            .eq('id', fromAccountId);
        }
      } catch (rollbackError) {
        console.error('[v0] Rollback failed:', rollbackError);
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Transfer processing failed',
          transaction: {
            id: transactionId,
            status: 'failed',
            transactionId,
            amount,
            fromAccount: '',
            toAccount: toAccountNumber,
            recipientName,
            timestamp
          },
          status: 'failed'
        },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('[v0] Transfer API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        transaction: {
          id: '',
          status: 'failed',
          transactionId: '',
          amount: 0,
          fromAccount: '',
          toAccount: '',
          recipientName: '',
          timestamp: new Date().toISOString()
        },
        status: 'error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/transfers/realtime?transactionId=xxx
 * Check transfer status in real-time
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json({ error: 'transactionId required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get transaction from database
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error) {
      console.error('[v0] Transaction not found:', error);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      transaction,
      status: transaction.status
    });

  } catch (error: any) {
    console.error('[v0] GET transfer API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transfer status' },
      { status: 500 }
    );
  }
}

function getBankName(bankCode: string): string {
  const banks: { [key: string]: string } = {
    'INTERNAL': 'Internal Transfer',
    'SWIFT': 'SWIFT International',
    'ACH': 'ACH Transfer',
    'FEDWIRE': 'FedWire',
    'CHIPS': 'CHIPS'
  };
  return banks[bankCode] || bankCode;
}
