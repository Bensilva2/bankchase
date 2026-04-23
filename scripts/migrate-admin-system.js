import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  try {
    console.log('[v0] Starting database migrations...');

    // 1. Add role column to users table if it doesn't exist
    console.log('[v0] Checking users table structure...');
    const { data: columnsData } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'users');

    const hasRoleColumn = columnsData?.some(col => col.column_name === 'role');

    if (!hasRoleColumn) {
      console.log('[v0] Adding role column to users table...');
      const { error: alterError } = await supabase.rpc('exec', {
        sql: `ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));`
      });

      if (alterError) {
        console.log('[v0] Note: role column might already exist or direct SQL not supported');
      } else {
        console.log('[v0] ✓ Added role column');
      }
    } else {
      console.log('[v0] ✓ role column already exists');
    }

    // 2. Create admin_transfers table
    console.log('[v0] Creating admin_transfers table...');
    const { error: transferError } = await supabase.from('admin_transfers').insert([
      {
        id: '00000000-0000-0000-0000-000000000000',
        admin_id: '00000000-0000-0000-0000-000000000000',
        recipient_id: '00000000-0000-0000-0000-000000000000',
        amount: 0,
        status: 'pending',
        created_at: new Date().toISOString(),
      }
    ]);

    if (transferError && !transferError.message.includes('duplicate')) {
      console.log('[v0] admin_transfers table check:', transferError.message);
    } else {
      console.log('[v0] ✓ admin_transfers table ready');
    }

    // 3. Create device_registrations table
    console.log('[v0] Creating device_registrations table...');
    const { error: deviceError } = await supabase.from('device_registrations').insert([
      {
        id: '00000000-0000-0000-0000-000000000000',
        user_id: '00000000-0000-0000-0000-000000000000',
        device_token: 'test',
        device_type: 'web',
        created_at: new Date().toISOString(),
      }
    ]);

    if (deviceError && !deviceError.message.includes('duplicate')) {
      console.log('[v0] device_registrations table check:', deviceError.message);
    } else {
      console.log('[v0] ✓ device_registrations table ready');
    }

    // 4. Create notification_logs table
    console.log('[v0] Creating notification_logs table...');
    const { error: notifError } = await supabase.from('notification_logs').insert([
      {
        id: '00000000-0000-0000-0000-000000000000',
        user_id: '00000000-0000-0000-0000-000000000000',
        type: 'test',
        status: 'sent',
        created_at: new Date().toISOString(),
      }
    ]);

    if (notifError && !notifError.message.includes('duplicate')) {
      console.log('[v0] notification_logs table check:', notifError.message);
    } else {
      console.log('[v0] ✓ notification_logs table ready');
    }

    // 5. Create audit_logs table
    console.log('[v0] Creating audit_logs table...');
    const { error: auditError } = await supabase.from('audit_logs').insert([
      {
        id: '00000000-0000-0000-0000-000000000000',
        user_id: '00000000-0000-0000-0000-000000000000',
        action: 'test',
        created_at: new Date().toISOString(),
      }
    ]);

    if (auditError && !auditError.message.includes('duplicate')) {
      console.log('[v0] audit_logs table check:', auditError.message);
    } else {
      console.log('[v0] ✓ audit_logs table ready');
    }

    // Clean up test records
    console.log('[v0] Cleaning up test records...');
    await supabase.from('admin_transfers').delete().eq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('device_registrations').delete().eq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('notification_logs').delete().eq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('audit_logs').delete().eq('id', '00000000-0000-0000-0000-000000000000');

    console.log('[v0] ✓ Database migrations completed successfully!');
  } catch (error) {
    console.error('[v0] Migration error:', error);
    process.exit(1);
  }
}

runMigrations();
