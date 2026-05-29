// File-based database for development when Supabase tables don't exist
// This provides persistent fallback storage

import * as fs from 'fs'
import * as path from 'path'

interface StoredUser {
  id: string
  username: string
  email: string
  password_hash: string
  first_name?: string
  last_name?: string
  phone?: string
  ssn?: string
  date_of_birth?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  created_at: string
}

interface StoredAccount {
  id: string
  user_id: string
  account_type: string
  account_number: string
  routing_number: string
  balance: number
  bank_name: string
  is_external: boolean
  created_at: string
}

// Use a temp directory for persistence
const dbDir = path.join('/tmp', 'mybank-db')
const usersFile = path.join(dbDir, 'users.json')
const accountsFile = path.join(dbDir, 'accounts.json')

// Initialize directory
try {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]))
  }
  if (!fs.existsSync(accountsFile)) {
    fs.writeFileSync(accountsFile, JSON.stringify([]))
  }
} catch (err) {
  console.error('[v0] Failed to initialize db directory:', err)
}

// Helper functions to read/write JSON
function readUsers(): StoredUser[] {
  try {
    const data = fs.readFileSync(usersFile, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]): void {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2))
  } catch (err) {
    console.error('[v0] Failed to write users:', err)
  }
}

function readAccounts(): StoredAccount[] {
  try {
    const data = fs.readFileSync(accountsFile, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

function writeAccounts(accounts: StoredAccount[]): void {
  try {
    fs.writeFileSync(accountsFile, JSON.stringify(accounts, null, 2))
  } catch (err) {
    console.error('[v0] Failed to write accounts:', err)
  }
}

export const inMemoryDb = {
  users: {
    async findByUsername(username: string): Promise<StoredUser | null> {
      const users = readUsers()
      return users.find((u) => u.username === username) || null
    },

    async findByEmail(email: string): Promise<StoredUser | null> {
      const users = readUsers()
      return users.find((u) => u.email === email) || null
    },

    async findById(id: string): Promise<StoredUser | null> {
      const users = readUsers()
      return users.find((u) => u.id === id) || null
    },

    async create(user: StoredUser): Promise<StoredUser> {
      const users = readUsers()
      users.push(user)
      writeUsers(users)
      return user
    },

    async getAll(): Promise<StoredUser[]> {
      return readUsers()
    },

    async deleteAll(): Promise<void> {
      writeUsers([])
    },
  },

  accounts: {
    async findByUserId(userId: string): Promise<StoredAccount[]> {
      const accounts = readAccounts()
      return accounts.filter((a) => a.user_id === userId)
    },

    async findById(id: string): Promise<StoredAccount | null> {
      const accounts = readAccounts()
      return accounts.find((a) => a.id === id) || null
    },

    async create(account: StoredAccount): Promise<StoredAccount> {
      const accounts = readAccounts()
      accounts.push(account)
      writeAccounts(accounts)
      return account
    },

    async update(id: string, data: Partial<StoredAccount>): Promise<StoredAccount | null> {
      const accounts = readAccounts()
      const account = accounts.find((a) => a.id === id)
      if (!account) return null
      Object.assign(account, data)
      writeAccounts(accounts)
      return account
    },

    async getAll(): Promise<StoredAccount[]> {
      return readAccounts()
    },

    async deleteAll(): Promise<void> {
      writeAccounts([])
    },
  },
}
