import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notification-service'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await NotificationService.deleteConnector(params.id)

    console.log('[v0] Connector deleted:', params.id)

    return NextResponse.json({
      success: true,
      message: 'Connector deleted',
    })
  } catch (error) {
    console.error('[v0] Failed to delete connector:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete connector' },
      { status: 500 }
    )
  }
}
