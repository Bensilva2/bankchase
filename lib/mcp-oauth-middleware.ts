import { NextRequest, NextResponse } from 'next/server'
import { mcpOAuthClient } from '@/lib/mcp-oauth-client'
import { createClient } from '@supabase/supabase-js'

/**
 * Middleware to verify MCP OAuth tokens for secured endpoints
 */
export async function verifyMCPOAuth(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        valid: false,
        error: 'Missing or invalid Authorization header',
        status: 401,
      }
    }

    const token = authHeader.substring(7)

    // Get user ID from query or body
    const url = new URL(request.url)
    let userId = url.searchParams.get('userId')

    if (!userId && request.method === 'POST') {
      try {
        const body = await request.json()
        userId = body.userId
      } catch (err) {
        // Continue without parsing body
      }
    }

    if (!userId) {
      return {
        valid: false,
        error: 'Missing userId',
        status: 400,
      }
    }

    // Verify token
    const isValid = await mcpOAuthClient.verifyToken(userId, token)

    if (!isValid) {
      return {
        valid: false,
        error: 'Invalid or expired token',
        status: 401,
      }
    }

    // Get user from database to verify they still exist
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: user } = await supabase
      .from('users')
      .select('id, auth0_id, email')
      .eq('id', userId)
      .single()

    if (!user) {
      return {
        valid: false,
        error: 'User not found',
        status: 404,
      }
    }

    return {
      valid: true,
      user,
      token,
    }
  } catch (error) {
    console.error('MCP OAuth verification error:', error)
    return {
      valid: false,
      error: 'Token verification failed',
      status: 500,
    }
  }
}

/**
 * Create a protected route handler that verifies MCP OAuth
 */
export function createProtectedMCPRoute(handler: Function) {
  return async (request: NextRequest) => {
    const verification = await verifyMCPOAuth(request)

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error },
        { status: verification.status }
      )
    }

    // Pass verified user to handler
    return handler(request, verification.user, verification.token)
  }
}
