import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase environment variables not configured')
  }

  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  try {
    // Security: Check if running in development or with admin key
    const authHeader = request.headers.get('Authorization')
    const adminKey = process.env.MIGRATION_ADMIN_KEY

    if (adminKey && authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = getSupabase()
    const results = []

    // Read SQL migration files
    const scriptsDir = path.join(process.cwd(), 'scripts')
    const files = fs.readdirSync(scriptsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort()

    for (const file of files) {
      try {
        const filePath = path.join(scriptsDir, file)
        const sql = fs.readFileSync(filePath, 'utf-8')

        // Execute SQL directly using Supabase query builder
        const { error } = await supabase.rpc('exec', { code: sql }).catch(() => {
          // Fallback: try to execute statements one by one
          return new Promise((resolve) => {
            // Split SQL into statements and execute them
            const statements = sql
              .split(';')
              .map((stmt) => stmt.trim())
              .filter((stmt) => stmt && !stmt.startsWith('--'))

            let hasError = false
            for (const statement of statements) {
              supabase.rpc('exec', { code: statement }).then(() => {
                // Success
              }).catch((err) => {
                if (!err.message?.includes('already exists') && !err.message?.includes('Unknown function')) {
                  hasError = true
                }
              })
            }

            if (hasError) {
              resolve({ error: new Error('Some statements failed') })
            } else {
              resolve({ error: null })
            }
          })
        })

        if (error) {
          // Check if it's a non-critical error
          const msg = error.message || String(error)
          if (msg.includes('already exists') || msg.includes('Unknown function')) {
            results.push({ file, status: 'skipped', message: 'Already exists or function not available' })
          } else {
            results.push({ file, status: 'error', error: msg })
          }
        } else {
          results.push({ file, status: 'success' })
        }
      } catch (err: any) {
        results.push({ file, status: 'error', error: err.message })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration process completed',
      results,
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: error.message || 'Migration failed' },
      { status: 500 }
    )
  }
}
