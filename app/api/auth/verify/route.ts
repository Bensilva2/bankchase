import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 })
  }

  try {
    // Single backend call - timeout after 3 seconds
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/verify`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const user = await response.json()
    return NextResponse.json({ user }, { status: 200 })
  } catch (error: any) {
    // No retries - just fail
    console.error('Token verification error:', error.message)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
