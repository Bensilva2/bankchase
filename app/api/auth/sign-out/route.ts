import { NextResponse } from 'next/server'

export async function POST() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Signed out',
    })
  } catch (error) {
    return NextResponse.json({ error: 'Sign-out failed' }, { status: 400 })
  }
}
