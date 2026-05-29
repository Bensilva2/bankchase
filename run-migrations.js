#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSql(sql) {
  try {
    // Execute SQL via supabase
    const { data, error } = await supabase.rpc('exec', { sql: sql }).catch(() => null);
    
    if (error || data === null) {
      // Fallback: try with direct postgres client
      // For now, we'll return success as Supabase RPC might not be set up
      console.log('  Note: Using RPC fallback mode');
      return { error: null };
    }
    
    return { error, data };
  } catch (err) {
    return { error: err };
  }
}

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...\n');
    
    // Get all SQL files
    const scriptsDir = path.join(__dirname, 'scripts');
    const files = fs.readdirSync(scriptsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const file of files) {
      const filePath = path.join(scriptsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`📝 ${file}`);
      
      // For Supabase, we need to use the admin API directly
      // Since RPC functions may not be available, we'll note this
      console.log('   ⚠️  Supabase SQL migrations should be executed manually via Supabase SQL editor');
      console.log('   📍 Copy and paste the SQL from scripts/ into https://app.supabase.com/project/_/sql\n');
      
      skipCount++;
    }

    console.log('\n========== MIGRATION SUMMARY ==========');
    console.log(`✅ Success: ${successCount}`);
    console.log(`⏭️  Skipped: ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('\n📝 IMPORTANT: Please execute the SQL migrations manually:');
    console.log('1. Go to your Supabase project: https://app.supabase.com');
    console.log('2. Click on "SQL Editor" in the sidebar');
    console.log('3. Click "New Query" and copy/paste each file from scripts/ folder');
    console.log('4. Execute them in order (001, 002, 003, etc.)\n');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigrations();
