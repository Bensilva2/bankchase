import { NextResponse } from 'next/server'

export async function POST() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Sign-up endpoint',
    })
  } catch (error) {
    return NextResponse.json({ error: 'Sign-up failed' }, { status: 400 })
  }
}
