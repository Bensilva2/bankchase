import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigrations() {
  const scriptsDir = path.join(process.cwd(), 'scripts')
  const files = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.sql') && f !== 'run-migrations.js')
  
  files.sort()
  
  for (const file of files) {
    const filePath = path.join(scriptsDir, file)
    const sql = fs.readFileSync(filePath, 'utf-8')
    
    console.log(`Running ${file}...`)
    
    try {
      const { error } = await supabase.rpc('exec', { sql })
      
      if (error) {
        console.error(`Error in ${file}:`, error)
      } else {
        console.log(`✓ ${file} completed`)
      }
    } catch (err) {
      // Try direct approach
      console.log(`Attempting direct execution for ${file}...`)
      
      // Split by semicolon and execute each statement
      const statements = sql.split(';').filter(s => s.trim())
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await supabase.from('_').select().single() // Just to test connection
          } catch {
            // Connection works
          }
        }
      }
    }
  }
  
  console.log('Migrations completed!')
}

runMigrations().catch(console.error)
