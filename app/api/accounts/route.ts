import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 })
  }

  try {
    // Single backend call - 5 second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/accounts`,
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
      if (response.status === 401) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('Accounts fetch error:', error.message)

    if (error.name === 'AbortError') {
      return NextResponse.json({ error: 'Service timeout' }, { status: 504 })
    }

    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}
