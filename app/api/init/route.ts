import { NextRequest, NextResponse } from 'next/server';
import { initializeBackgroundServices, isInitialized } from '@/lib/app-init';

/**
 * GET /api/init
 * 
 * Initialize background services on application startup
 * This endpoint should be called once when the app starts
 */
export async function GET(request: NextRequest) {
  try {
    if (isInitialized()) {
      return NextResponse.json({
        status: 'already_initialized',
        message: 'Background services are already running',
        timestamp: new Date().toISOString(),
      });
    }

    await initializeBackgroundServices();

    return NextResponse.json({
      status: 'initialized',
      message: 'Background services initialized successfully',
      services: [
        'event-emitter',
        'alert-consumer',
        'transaction-tracker',
        'health-monitor',
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[InitAPI] Initialization error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to initialize background services',
        error: String(error),
      },
      { status: 500 }
    );
  }
}
