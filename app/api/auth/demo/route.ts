/**
 * Demo Login Endpoint - Works without Supabase for testing
 * Allows users to test the full application flow
 */

import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, verifyPassword } from '@/lib/auth/password-utils'

// Demo credentials
const DEMO_USERS = [
  {
    id: 'demo-user-001',
    name: 'CHUN HUNG',
    email: 'chunhung@example.com',
    username: 'chunhung',
    password_hash: '', // Will be set on first request
    role: 'user',
    accounts: [
      {
        id: 'demo-acct-001',
        accountNumber: '123456789012',
        maskedAccountNumber: '****6789',
        accountType: 'checking',
        accountName: 'My Checking Account',
        balance: 5000,
        availableBalance: 5000,
        routingNumber: '021000021'
      }
    ]
  },
  {
    id: 'demo-user-002',
    name: 'John Doe',
    email: 'john@example.com',
    username: 'johndoe',
    password_hash: '',
    role: 'user',
    accounts: [
      {
        id: 'demo-acct-002',
        accountNumber: '987654321098',
        maskedAccountNumber: '****1098',
        accountType: 'savings',
        accountName: 'My Savings Account',
        balance: 10000,
        availableBalance: 10000,
        routingNumber: '021000021'
      }
    ]
  }
]

// Initialize password hashes
async function initializeDemoUsers() {
  for (const user of DEMO_USERS) {
    if (!user.password_hash) {
      user.password_hash = await hashPassword('Demo@123')
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDemoUsers()

    const body = await request.json()
    const { action, email, password } = body

    if (action === 'login') {
      console.log(`[v0] Demo login attempt for: ${email}`)

      // Find user by email or username
      const user = DEMO_USERS.find(
        u => u.email === email || u.username === email || u.name === email
      )

      if (!user) {
        console.log(`[v0] Demo user not found for: ${email}`)
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }

      // Verify password
      const passwordValid = await verifyPassword(password, user.password_hash)
      if (!passwordValid) {
        console.log(`[v0] Demo password verification failed for user: ${user.name}`)
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }

      console.log(`[v0] Demo login successful for: ${user.name}`)

      return NextResponse.json({
        success: true,
        message: 'Login successful',
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        accounts: user.accounts,
        sessionToken: 'demo_session_' + Date.now(),
        isDemo: true,
      })
    }

    if (action === 'register') {
      const { firstName, lastName, email: newEmail, username: newUsername, password: newPassword } = body

      // Create new demo user
      const newUserId = 'demo-user-' + Date.now()
      const newUser = {
        id: newUserId,
        name: `${firstName} ${lastName}`,
        email: newEmail,
        username: newUsername,
        password_hash: await hashPassword(newPassword),
        role: 'user',
        accounts: [
          {
            id: 'demo-acct-' + Date.now(),
            accountNumber: Math.random().toString().slice(2, 14),
            maskedAccountNumber: `****${Math.random().toString().slice(2, 6)}`,
            accountType: 'checking',
            accountName: 'My Checking Account',
            balance: 0,
            availableBalance: 0,
            routingNumber: '021000021'
          }
        ]
      }

      console.log(`[v0] Demo user created: ${newUser.name}`)

      return NextResponse.json({
        success: true,
        message: 'Account created successfully',
        userId: newUser.id,
        userName: newUser.name,
        accounts: newUser.accounts,
        isDemo: true,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[v0] Demo auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
