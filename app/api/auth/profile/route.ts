import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // Validate required fields
    const { firstName, lastName, email, phone, address, city, state, zipCode } = body
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      )
    }

    // 5 second timeout for backend request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/profile`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone: phone || null,
          address: address || null,
          city: city || null,
          state: state || null,
          zip_code: zipCode || null,
        }),
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (response.status === 400) {
        const error = await response.json()
        return NextResponse.json(error, { status: 400 })
      }
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('[v0] Profile update error:', error.message)

    if (error.name === 'AbortError') {
      return NextResponse.json({ error: 'Service timeout' }, { status: 504 })
    }

    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
