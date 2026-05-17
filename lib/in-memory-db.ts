// In-memory database for development when Supabase tables don't exist
// This provides a fallback storage mechanism

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

// In-memory storage
let memoryUsers: StoredUser[] = []
let memoryAccounts: StoredAccount[] = []

export const inMemoryDb = {
  users: {
    async findByUsername(username: string): Promise<StoredUser | null> {
      return memoryUsers.find((u) => u.username === username) || null
    },

    async findByEmail(email: string): Promise<StoredUser | null> {
      return memoryUsers.find((u) => u.email === email) || null
    },

    async findById(id: string): Promise<StoredUser | null> {
      return memoryUsers.find((u) => u.id === id) || null
    },

    async create(user: StoredUser): Promise<StoredUser> {
      memoryUsers.push(user)
      return user
    },

    async getAll(): Promise<StoredUser[]> {
      return memoryUsers
    },

    async deleteAll(): Promise<void> {
      memoryUsers = []
    },
  },

  accounts: {
    async findByUserId(userId: string): Promise<StoredAccount[]> {
      return memoryAccounts.filter((a) => a.user_id === userId)
    },

    async findById(id: string): Promise<StoredAccount | null> {
      return memoryAccounts.find((a) => a.id === id) || null
    },

    async create(account: StoredAccount): Promise<StoredAccount> {
      memoryAccounts.push(account)
      return account
    },

    async update(id: string, data: Partial<StoredAccount>): Promise<StoredAccount | null> {
      const account = memoryAccounts.find((a) => a.id === id)
      if (!account) return null
      Object.assign(account, data)
      return account
    },

    async getAll(): Promise<StoredAccount[]> {
      return memoryAccounts
    },

    async deleteAll(): Promise<void> {
      memoryAccounts = []
    },
  },
}
