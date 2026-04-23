// Demo credentials for development and testing
// Username: CHUN HUNG
// Password: Chun200@ (hashed using bcrypt)
// NEVER use these in production - for development/demo only

export const DEMO_CREDENTIALS = {
  firstName: "CHUN",
  lastName: "HUNG",
  email: "chun.hung@demo.example.com",
  username: "CHUN HUNG",
  // This is a bcrypt hash of "Chun200@"
  // To generate: bcrypt.hash("Chun200@", 10)
  passwordHash: "$2b$10$YourHashedPasswordHere", // Replace with actual bcrypt hash
  // Plain text ONLY for reference - NEVER store this
  passwordPlain: "Chun200@",
}

export const DEMO_ACCOUNTS = [
  {
    accountType: "Checking",
    accountNumber: "****5001",
    balance: 5250.75,
    currency: "USD",
  },
  {
    accountType: "Savings",
    accountNumber: "****5002",
    balance: 12500.00,
    currency: "USD",
  },
  {
    accountType: "Money Market",
    accountNumber: "****5003",
    balance: 25000.50,
    currency: "USD",
  },
]

export const DEMO_TRANSACTIONS = [
  {
    type: "transfer",
    amount: 500.00,
    description: "Transfer to Savings",
    timestamp: new Date(Date.now() - 86400000),
  },
  {
    type: "payment",
    amount: 150.00,
    description: "Utilities Bill Payment",
    timestamp: new Date(Date.now() - 172800000),
  },
  {
    type: "deposit",
    amount: 1000.00,
    description: "Direct Deposit",
    timestamp: new Date(Date.now() - 259200000),
  },
]
