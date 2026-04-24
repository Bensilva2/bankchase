import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function initDatabase() {
  try {
    console.log("Initializing database tables...")

    // Create users table
    const { error: usersError } = await supabase.rpc("exec", {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(255) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          phone VARCHAR(20),
          ssn VARCHAR(11),
          date_of_birth DATE,
          address VARCHAR(255),
          city VARCHAR(255),
          state VARCHAR(2),
          zip_code VARCHAR(10),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
    })

    if (usersError) {
      console.log("Users table already exists or error:", usersError.message)
    } else {
      console.log("✓ Users table created")
    }

    // Create accounts table
    const { error: accountsError } = await supabase.rpc("exec", {
      sql: `
        CREATE TABLE IF NOT EXISTS accounts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id),
          account_type VARCHAR(50),
          account_number VARCHAR(20),
          routing_number VARCHAR(20),
          balance DECIMAL(12, 2) DEFAULT 5000.00,
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
    })

    if (accountsError) {
      console.log("Accounts table already exists or error:", accountsError.message)
    } else {
      console.log("✓ Accounts table created")
    }

    // Create transactions table
    const { error: transactionsError } = await supabase.rpc("exec", {
      sql: `
        CREATE TABLE IF NOT EXISTS transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          account_id UUID NOT NULL REFERENCES accounts(id),
          type VARCHAR(50),
          amount DECIMAL(12, 2),
          description VARCHAR(255),
          status VARCHAR(50) DEFAULT 'completed',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
    })

    if (transactionsError) {
      console.log("Transactions table already exists or error:", transactionsError.message)
    } else {
      console.log("✓ Transactions table created")
    }

    console.log("✓ Database initialization complete")
  } catch (error) {
    console.error("Database initialization failed:", error)
    process.exit(1)
  }
}

initDatabase()
