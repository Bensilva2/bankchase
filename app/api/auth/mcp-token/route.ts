import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { mcpOAuthClient } from '@/lib/mcp-oauth-client'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth_user')

    if (!authCookie?.value) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = JSON.parse(authCookie.value)
    const { action } = await request.json()

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    let response: any

    if (action === 'request') {
      // Generate new token
      const { token, expiresAt } = mcpOAuthClient.generateToken()
      await mcpOAuthClient.storeUserToken(user.id, token, expiresAt)

      response = {
        token,
        expiresAt,
        userId: user.id,
        message: 'MCP token generated successfully',
      }
    } else if (action === 'refresh') {
      // Refresh existing token
      const { token, expiresAt } = await mcpOAuthClient.refreshToken(user.id)

      response = {
        token,
        expiresAt,
        userId: user.id,
        message: 'MCP token refreshed successfully',
      }
    } else if (action === 'revoke') {
      // Revoke token
      await mcpOAuthClient.revokeToken(user.id)

      response = {
        message: 'MCP token revoked successfully',
      }
    } else if (action === 'verify') {
      // Verify token validity
      const { token } = await request.json()

      if (!token) {
        return NextResponse.json(
          { error: 'Token is required' },
          { status: 400 }
        )
      }

      const isValid = await mcpOAuthClient.verifyToken(user.id, token)

      response = {
        valid: isValid,
        userId: user.id,
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('MCP token error:', error)
    return NextResponse.json(
      { error: 'Failed to process MCP token request' },
      { status: 500 }
    )
  }
}
