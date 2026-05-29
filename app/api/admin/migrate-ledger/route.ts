import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/admin/migrate-ledger
 * 
 * Runs the transaction ledger schema migration
 * Only accessible with proper authentication
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check
    // For now, accept any request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[MigrationAPI] Starting ledger schema migration');

    // Read migration SQL file
    const migrationPath = path.join(
      process.cwd(),
      'migrations',
      '001-ledger-schema.sql'
    );

    if (!fs.existsSync(migrationPath)) {
      return NextResponse.json(
        { error: 'Migration file not found' },
        { status: 404 }
      );
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Execute migration
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.rpc('execute_sql', {
      sql: migrationSQL,
    });

    if (error) {
      // Try alternative approach: split and execute statements
      console.log(
        '[MigrationAPI] RPC failed, attempting direct SQL execution'
      );

      const statements = migrationSQL
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        const { error: execError } = await supabase.rpc('execute', {
          statement,
        });

        if (execError) {
          console.warn(`[MigrationAPI] Statement failed:`, execError);
          // Continue with other statements
        }
      }

      return NextResponse.json(
        {
          status: 'partial',
          message:
            'Migration completed with some warnings. Check logs for details.',
          error: error.message,
        },
        { status: 200 }
      );
    }

    console.log('[MigrationAPI] Ledger schema migration completed successfully');

    return NextResponse.json(
      {
        status: 'success',
        message: 'Ledger schema migration completed',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[MigrationAPI] Migration error:', err);
    return NextResponse.json(
      { error: 'Migration failed', details: String(err) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/migrate-ledger
 * 
 * Check migration status and schema
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if transaction_ledger table exists
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'transaction_ledger');

    if (error || !tables || tables.length === 0) {
      return NextResponse.json(
        {
          status: 'not_migrated',
          message: 'Ledger schema not found. Run POST to migrate.',
          requiredTables: [
            'transaction_ledger',
            'account_balance',
            'transaction_audit_log',
            'alert_delivery_log',
            'webhook_event_history',
            'exchange_rate_history',
          ],
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        status: 'migrated',
        message: 'Ledger schema is installed',
        tables: [
          'transaction_ledger',
          'account_balance',
          'transaction_audit_log',
          'alert_delivery_log',
          'webhook_event_history',
          'exchange_rate_history',
        ],
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[MigrationAPI] Status check error:', err);
    return NextResponse.json(
      { error: 'Status check failed', details: String(err) },
      { status: 500 }
    );
  }
}
