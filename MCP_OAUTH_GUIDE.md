# MCP OAuth Integration Guide

This document explains how to use the MCP (Model Context Protocol) OAuth token system for secured server-to-server communication.

## Overview

The MCP OAuth system provides secure, time-limited tokens for external services or MCP clients to interact with your application on behalf of authenticated users.

## Token Flow

```
1. User logs in via Auth0
2. User requests MCP token: POST /api/auth/mcp-token { action: 'request' }
3. Server generates secure token and stores in database
4. Token returned to user with expiry time
5. User passes token in Authorization header to MCP endpoints
6. Server verifies token before processing request
7. MCP client executes action with verified user context
```

## API Endpoints

### Request Token

```bash
POST /api/auth/mcp-token
Authorization: Cookie (session required)
Content-Type: application/json

{
  "action": "request"
}

Response:
{
  "token": "a1b2c3d4e5f6...",
  "expiresAt": "2026-05-28T15:10:45.000Z",
  "userId": "user-123",
  "message": "MCP token generated successfully"
}
```

### Refresh Token

```bash
POST /api/auth/mcp-token
Authorization: Cookie (session required)
Content-Type: application/json

{
  "action": "refresh"
}

Response:
{
  "token": "f6e5d4c3b2a1...",
  "expiresAt": "2026-05-29T15:10:45.000Z",
  "userId": "user-123",
  "message": "MCP token refreshed successfully"
}
```

### Verify Token

```bash
POST /api/auth/mcp-token
Authorization: Cookie (session required)
Content-Type: application/json

{
  "action": "verify",
  "token": "a1b2c3d4e5f6..."
}

Response:
{
  "valid": true,
  "userId": "user-123"
}
```

### Revoke Token

```bash
POST /api/auth/mcp-token
Authorization: Cookie (session required)
Content-Type: application/json

{
  "action": "revoke"
}

Response:
{
  "message": "MCP token revoked successfully"
}
```

## Protected MCP Endpoints

### Create Protected Endpoint

```typescript
// app/api/mcp/your-action/route.ts
import { createProtectedMCPRoute } from '@/lib/mcp-oauth-middleware'

async function handler(request: Request, user: any, token: string) {
  // User is already verified
  console.log('Authenticated as:', user.email)
  
  // Your logic here
  return Response.json({ success: true })
}

export const POST = createProtectedMCPRoute(handler)
```

### Using Protected Endpoint

```bash
POST /api/mcp/your-action
Authorization: Bearer <mcp-token>
Content-Type: application/json

{
  "userId": "user-123",
  "action": "process",
  "data": { ... }
}
```

## Example: Using MCP OAuth in Frontend

```typescript
// Get MCP Token
async function getMCPToken() {
  const response = await fetch('/api/auth/mcp-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'request' }),
  })
  const { token } = await response.json()
  return token
}

// Use Token for MCP Request
async function callMCPEndpoint(userId: string, action: string, data: any) {
  const token = await getMCPToken()

  const response = await fetch('/api/mcp/example', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      action,
      data,
    }),
  })

  return response.json()
}

// Usage
const result = await callMCPEndpoint(
  'user-123',
  'get_data',
  { filter: 'active' }
)
```

## Example: Backend-to-Backend Communication

```typescript
// From your MCP client or external service
async function authenticateWithMCP(userId: string, mcpToken: string) {
  const response = await fetch('https://your-app.com/api/mcp/example', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${mcpToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      action: 'process_data',
      data: { /* your data */ },
    }),
  })

  if (!response.ok) {
    throw new Error(`MCP error: ${response.statusText}`)
  }

  return response.json()
}
```

## Security Best Practices

### Token Storage
- Store tokens in secure, server-side session storage (not localStorage)
- Never expose tokens in client-side code or logs
- Rotate tokens regularly (recommended: every 24 hours)

### Token Transmission
- Always use HTTPS in production
- Send tokens in Authorization header only
- Never send tokens in URLs or request body

### Token Verification
- Verify token signature on every request
- Check token expiration time
- Validate user still exists in database
- Implement rate limiting on token endpoints

### RBAC (Role-Based Access Control)
```typescript
// In your handler function
if (user.role !== 'admin') {
  return Response.json({ error: 'Unauthorized' }, { status: 403 })
}
```

### Audit Logging
```typescript
// Log all MCP actions for compliance
console.log({
  timestamp: new Date(),
  userId: user.id,
  action,
  data: { /* sanitized data */ },
  ipAddress: request.headers.get('x-forwarded-for'),
})
```

## Token Configuration

Configure token expiry in `.env`:
```
OTP_EXPIRY_MINUTES=10  # OTP token lifetime
# Add MCP token lifetime
MCP_TOKEN_EXPIRY_HOURS=24
```

## Troubleshooting

### "Invalid or expired token"
- Token may have expired (default: 24 hours)
- Request a new token with action: 'refresh'
- Verify token format is correct

### "Missing Authorization header"
- Add `Authorization: Bearer <token>` to request headers
- Ensure token is not expired
- Verify userId in request body matches token owner

### "User not found"
- User may have been deleted from database
- Regenerate token to refresh user context
- Check userId is correct

## Architecture Diagram

```
┌─────────────────┐
│  Auth0 Login    │
│                 │
└────────┬────────┘
         │
         v
┌─────────────────────────┐
│ User Session Created    │
│ (Cookie/Session)        │
└────────┬────────────────┘
         │
         v
┌─────────────────────────────────────┐
│ Request MCP Token                   │
│ POST /api/auth/mcp-token            │
│ { action: 'request' }               │
└────────┬────────────────────────────┘
         │
         v
┌─────────────────────────────────────┐
│ Generate Secure Token               │
│ Store: userId, token, expiry        │
│ Return: token, expiresAt            │
└────────┬────────────────────────────┘
         │
         v
┌─────────────────────────────────────┐
│ Call Protected MCP Endpoint         │
│ POST /api/mcp/example               │
│ Auth: Bearer <token>                │
└────────┬────────────────────────────┘
         │
         v
┌─────────────────────────────────────┐
│ Verify Token (Middleware)           │
│ - Check expiry                      │
│ - Verify signature                  │
│ - Load user from DB                 │
└────────┬────────────────────────────┘
         │
         v
┌─────────────────────────────────────┐
│ Execute Handler with User Context   │
│ - Process request                   │
│ - Log action                        │
│ - Return response                   │
└─────────────────────────────────────┘
```

## Files

- `lib/mcp-oauth-client.ts` - Token generation and verification
- `lib/mcp-oauth-middleware.ts` - OAuth verification middleware
- `app/api/auth/mcp-token/route.ts` - Token management endpoint
- `app/api/mcp/example/route.ts` - Example protected endpoint

## Next Steps

1. Implement your specific MCP endpoints
2. Add RBAC policies for access control
3. Setup audit logging
4. Configure token rotation strategy
5. Test with external MCP clients
