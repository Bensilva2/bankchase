import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

function getAgentMailClient() {
  const apiKey = process.env.AGENTMAIL_API_KEY
  if (!apiKey) {
    throw new Error('AGENTMAIL_API_KEY is not configured')
  }
  
  return axios.create({
    baseURL: 'https://api.agentmail.to/v0',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const { action, inboxId, limit = 10, pageToken } = await request.json()

    if (action === 'create') {
      const { username, domain, displayName } = await request.json()
      
      const client = getAgentMailClient()
      const response = await client.post('/inboxes', {
        username,
        domain,
        display_name: displayName,
      })

      return NextResponse.json({
        success: true,
        inbox: response.data,
      })
    }

    if (action === 'list-messages' && inboxId) {
      const client = getAgentMailClient()
      const response = await client.get(`/inboxes/${inboxId}/messages`, {
        params: {
          limit,
          page_token: pageToken,
        },
      })

      return NextResponse.json({
        success: true,
        messages: response.data.messages,
        pageToken: response.data.page_token,
        total: response.data.total,
      })
    }

    if (action === 'get-message' && inboxId) {
      const { messageId } = await request.json()
      
      if (!messageId) {
        return NextResponse.json(
          { success: false, error: 'Missing messageId' },
          { status: 400 }
        )
      }

      const client = getAgentMailClient()
      const response = await client.get(`/inboxes/${inboxId}/messages/${messageId}`)

      return NextResponse.json({
        success: true,
        message: response.data,
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Supported: create, list-messages, get-message' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[Email Inbox API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const inboxId = searchParams.get('inboxId')
    const action = searchParams.get('action') || 'list-messages'
    const limit = parseInt(searchParams.get('limit') || '10')
    const pageToken = searchParams.get('pageToken')

    if (!inboxId) {
      return NextResponse.json(
        { success: false, error: 'Missing inboxId parameter' },
        { status: 400 }
      )
    }

    const client = getAgentMailClient()

    if (action === 'list-messages') {
      const response = await client.get(`/inboxes/${inboxId}/messages`, {
        params: {
          limit,
          page_token: pageToken,
        },
      })

      return NextResponse.json({
        success: true,
        messages: response.data.messages,
        pageToken: response.data.page_token,
        total: response.data.total,
      })
    }

    const messageId = searchParams.get('messageId')
    if (action === 'get-message' && messageId) {
      const response = await client.get(`/inboxes/${inboxId}/messages/${messageId}`)

      return NextResponse.json({
        success: true,
        message: response.data,
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action or missing parameters' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[Email Inbox API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
