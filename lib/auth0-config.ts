import { ManagementClient } from 'auth0'

export const auth0Config = {
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  managementApiToken: process.env.AUTH0_MANAGEMENT_API_TOKEN!,
  baseURL: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
}

export function getAuth0ManagementClient(): ManagementClient {
  return new ManagementClient({
    domain: auth0Config.domain,
    clientId: auth0Config.clientId,
    clientSecret: auth0Config.clientSecret,
  })
}

export function validateAuth0Config() {
  const required = ['AUTH0_DOMAIN', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET', 'AUTH0_MANAGEMENT_API_TOKEN']
  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing Auth0 configuration: ${missing.join(', ')}`)
  }
}
