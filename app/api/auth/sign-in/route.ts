import { NextResponse } from 'next/server'

export async function POST() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Sign-in endpoint',
    })
  } catch (error) {
    return NextResponse.json({ error: 'Sign-in failed' }, { status: 400 })
  }
}
