import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({
      user: null,
      session: null,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Session fetch failed' }, { status: 400 })
  }
}
