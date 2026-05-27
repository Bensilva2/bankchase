import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export class MCPOAuthClient {
  private supabase: any

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      console.warn('Supabase environment variables not configured')
    } else {
      this.supabase = createClient(url, key)
    }
  }

  /**
   * Generate a secure OAuth token for MCP server access
   */
  generateToken(): { token: string; expiresAt: string } {
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours

    return { token, expiresAt }
  }

  /**
   * Store OAuth token for user
   */
  async storeUserToken(userId: string, token: string, expiresAt: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({
          mcp_token: token,
          mcp_token_expires_at: expiresAt,
        })
        .eq('id', userId)

      if (error) {
        throw error
      }
    } catch (err: any) {
      console.error('Failed to store MCP token:', err)
      throw new Error('Failed to store token')
    }
  }

  /**
   * Verify OAuth token
   */
  async verifyToken(userId: string, token: string): Promise<boolean> {
    try {
      const { data } = await this.supabase
        .from('users')
        .select('mcp_token, mcp_token_expires_at')
        .eq('id', userId)
        .single()

      if (!data) {
        return false
      }

      const tokenMatch = data.mcp_token === token
      const isExpired = new Date(data.mcp_token_expires_at) < new Date()

      return tokenMatch && !isExpired
    } catch (err) {
      console.error('Failed to verify token:', err)
      return false
    }
  }

  /**
   * Refresh OAuth token
   */
  async refreshToken(userId: string): Promise<{ token: string; expiresAt: string }> {
    try {
      const { token, expiresAt } = this.generateToken()

      await this.storeUserToken(userId, token, expiresAt)

      return { token, expiresAt }
    } catch (err: any) {
      console.error('Failed to refresh token:', err)
      throw new Error('Failed to refresh token')
    }
  }

  /**
   * Revoke OAuth token
   */
  async revokeToken(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({
          mcp_token: null,
          mcp_token_expires_at: null,
        })
        .eq('id', userId)

      if (error) {
        throw error
      }
    } catch (err: any) {
      console.error('Failed to revoke token:', err)
      throw new Error('Failed to revoke token')
    }
  }

  /**
   * Validate OAuth request to MCP server
   */
  validateMCPRequest(
    userId: string,
    token: string,
    action: string,
    resource: string
  ): { valid: boolean; error?: string } {
    // Additional validation logic can be added here
    // This is a placeholder for more complex RBAC rules

    if (!userId || !token || !action || !resource) {
      return { valid: false, error: 'Missing required fields' }
    }

    return { valid: true }
  }
}

export const mcpOAuthClient = new MCPOAuthClient()
