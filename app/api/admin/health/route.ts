import { NextRequest, NextResponse } from 'next/server';
import { getRetryQueueStatus } from '@/lib/alert-consumer';

interface HealthMetrics {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  alertConsumer: {
    status: 'active' | 'inactive';
    pendingRetries: number;
    queueDepth: number;
  };
  redis: {
    connected: boolean;
    responseTime?: number;
  };
  eventEmitter: {
    status: 'ready' | 'initializing';
    listeners: number;
  };
}

// Track alert consumer state
let alertConsumerActive = false;
let startTime = Date.now();

export function setAlertConsumerActive(active: boolean) {
  alertConsumerActive = active;
}

/**
 * GET /api/admin/health
 * 
 * System health monitoring endpoint
 * Returns metrics on event consumers, alert queue, and system status
 */
export async function GET(request: NextRequest): Promise<NextResponse<HealthMetrics>> {
  try {
    const retryStatus = getRetryQueueStatus();
    const uptime = Date.now() - startTime;

    // Determine overall health
    let healthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (!alertConsumerActive) {
      healthStatus = 'unhealthy';
    } else if (retryStatus.pendingRetries > 50) {
      healthStatus = 'degraded';
    }

    const metrics: HealthMetrics = {
      status: healthStatus,
      timestamp: new Date().toISOString(),
      uptime,
      alertConsumer: {
        status: alertConsumerActive ? 'active' : 'inactive',
        pendingRetries: retryStatus.pendingRetries,
        queueDepth: retryStatus.queueEntries.length,
      },
      redis: {
        connected: true, // TODO: Implement actual Redis connectivity check
        responseTime: 1, // TODO: Measure actual response time
      },
      eventEmitter: {
        status: 'ready',
        listeners: 4, // transfer events + alert events
      },
    };

    return NextResponse.json(metrics, {
      status: healthStatus === 'unhealthy' ? 503 : 200,
    });
  } catch (error) {
    console.error('[HealthAPI] Error getting health metrics:', error);

    const errorMetrics: HealthMetrics = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      alertConsumer: {
        status: 'inactive',
        pendingRetries: 0,
        queueDepth: 0,
      },
      redis: {
        connected: false,
      },
      eventEmitter: {
        status: 'initializing',
        listeners: 0,
      },
    };

    return NextResponse.json(errorMetrics, { status: 503 });
  }
}

/**
 * GET /api/admin/health/detailed
 * 
 * Detailed health information including individual component metrics
 */
export async function getDetailedHealth() {
  try {
    const retryStatus = getRetryQueueStatus();
    const uptime = Date.now() - startTime;

    return {
      system: {
        status: alertConsumerActive ? 'operational' : 'degraded',
        uptime,
        startTime: new Date(startTime).toISOString(),
        currentTime: new Date().toISOString(),
      },
      components: {
        alertConsumer: {
          status: alertConsumerActive ? 'running' : 'stopped',
          pendingRetries: retryStatus.pendingRetries,
          retryDetails: retryStatus.queueEntries.map((entry) => ({
            transactionId: entry.transactionId,
            phone: entry.phone.slice(0, 6) + '****', // Mask phone number
            retryCount: entry.retryCount,
            lastAttempt: new Date(entry.lastRetryTime).toISOString(),
          })),
        },
        eventSystem: {
          status: 'operational',
          eventsSupported: [
            'transfer.initiated',
            'transfer.completed',
            'transfer.failed',
            'alert.scheduled',
            'compliance.checked',
          ],
        },
        database: {
          status: 'connected', // TODO: Implement actual DB connectivity check
        },
        redis: {
          status: 'connected', // TODO: Implement actual Redis connectivity check
        },
      },
    };
  } catch (error) {
    console.error('[HealthAPI] Error getting detailed health:', error);
    throw error;
  }
}
