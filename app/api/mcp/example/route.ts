import { NextRequest, NextResponse } from 'next/server'
import { createProtectedMCPRoute } from '@/lib/mcp-oauth-middleware'

/**
 * Example MCP endpoint that requires OAuth token verification
 * Usage: POST /api/mcp/example
 * Headers: Authorization: Bearer <token>
 * Body: { userId: "...", data: {...} }
 */
async function handler(request: NextRequest, user: any, token: string) {
  try {
    const body = await request.json()
    const { action, data } = body

    // Validate action
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    console.log(`[v0] MCP action: ${action} by user: ${user.email}`)

    // Example actions - implement based on your needs
    if (action === 'get_data') {
      return NextResponse.json(
        {
          success: true,
          data: {
            userId: user.id,
            email: user.email,
            auth0Id: user.auth0_id,
            message: 'Data retrieved successfully',
          },
        },
        { status: 200 }
      )
    } else if (action === 'set_data') {
      // Process data here
      return NextResponse.json(
        {
          success: true,
          message: 'Data set successfully',
          data: data,
        },
        { status: 200 }
      )
    } else if (action === 'delete_data') {
      // Delete operation
      return NextResponse.json(
        {
          success: true,
          message: 'Data deleted successfully',
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('MCP handler error:', error)
    return NextResponse.json(
      { error: 'Failed to process MCP request' },
      { status: 500 }
    )
  }
}

export const POST = createProtectedMCPRoute(handler)
