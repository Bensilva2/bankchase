import { createClient } from '@supabase/supabase-js'
import { ManagementClient } from 'auth0'

export class Auth0PostgresWrapper {
  private supabase: any
  private managementClient: ManagementClient

  constructor(managementClient?: ManagementClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      console.warn('Supabase environment variables not configured')
    } else {
      this.supabase = createClient(url, key)
    }

    this.managementClient = managementClient!
  }

  /**
   * Sync Auth0 user to Postgres database
   */
  async syncUserToDatabase(auth0User: any): Promise<any> {
    try {
      const user = {
        auth0_id: auth0User.sub || auth0User.user_id,
        email: auth0User.email,
        username: auth0User.nickname || auth0User.email?.split('@')[0],
        first_name: auth0User.given_name,
        last_name: auth0User.family_name,
        email_verified: auth0User.email_verified || false,
        phone: auth0User.phone_number,
        picture: auth0User.picture,
        metadata: auth0User.user_metadata || {},
        app_metadata: auth0User.app_metadata || {},
        last_login: auth0User.last_login,
        logins_count: auth0User.logins_count || 0,
      }

      // Check if user already exists
      const { data: existingUser, error: selectError } = await this.supabase
        .from('users')
        .select('*')
        .eq('auth0_id', user.auth0_id)
        .single()

      if (selectError && !selectError.message?.includes('No rows')) {
        throw selectError
      }

      let result: any

      if (existingUser) {
        // Update existing user
        const { data, error } = await this.supabase
          .from('users')
          .update(user)
          .eq('auth0_id', user.auth0_id)
          .select()
          .single()

        if (error) {
          throw error
        }

        result = data
      } else {
        // Create new user
        const { data, error } = await this.supabase
          .from('users')
          .insert([user])
          .select()
          .single()

        if (error) {
          throw error
        }

        result = data

        // Create default checking account for new users
        await this.createDefaultAccounts(result.id)
      }

      return result
    } catch (err: any) {
      console.error('Failed to sync user to database:', err)
      throw new Error('Failed to sync user: ' + err.message)
    }
  }

  /**
   * Create default accounts for new user
   */
  private async createDefaultAccounts(userId: string): Promise<void> {
    try {
      const accounts = [
        {
          user_id: userId,
          account_type: 'Checking',
          account_number: this.generateAccountNumber(),
          routing_number: '021000021',
          balance: 0,
          bank_name: 'Chase Bank',
          is_external: false,
        },
        {
          user_id: userId,
          account_type: 'Savings',
          account_number: this.generateAccountNumber(),
          routing_number: '021000021',
          balance: 0,
          bank_name: 'Chase Bank',
          is_external: false,
        },
      ]

      const { error } = await this.supabase
        .from('accounts')
        .insert(accounts)

      if (error) {
        console.error('Failed to create default accounts:', error)
      }
    } catch (err) {
      console.error('Error creating default accounts:', err)
    }
  }

  /**
   * Update Auth0 user metadata with MCP token
   */
  async updateAuth0MCPToken(auth0UserId: string, mcpToken: string, expiresAt: string): Promise<void> {
    try {
      await this.managementClient.users.update({ id: auth0UserId }, {
        app_metadata: {
          mcp_token: mcpToken,
          mcp_token_expires_at: expiresAt,
        },
      })
    } catch (err: any) {
      console.error('Failed to update Auth0 metadata:', err)
      throw new Error('Failed to update user metadata')
    }
  }

  /**
   * Get Auth0 user by email
   */
  async getAuth0UserByEmail(email: string): Promise<any> {
    try {
      const users = await this.managementClient.usersByEmail.getAll({ email })
      return users.length > 0 ? users[0] : null
    } catch (err: any) {
      console.error('Failed to get Auth0 user:', err)
      return null
    }
  }

  /**
   * Revoke Auth0 tokens
   */
  async revokeTokens(auth0UserId: string): Promise<void> {
    try {
      // Invalidate refresh tokens
      await this.managementClient.users.invalidateSessions({ id: auth0UserId })
    } catch (err: any) {
      console.error('Failed to revoke tokens:', err)
      throw new Error('Failed to revoke tokens')
    }
  }

  private generateAccountNumber(): string {
    return Math.random().toString().slice(2, 12).padEnd(10, '0')
  }
}
