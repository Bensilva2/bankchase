/**
 * OpenTelemetry Instrumentation for Push Notifications
 * Traces push notification lifecycle, permissions, and channel delivery
 */

import { trace, context, SpanStatusCode } from '@opentelemetry/api'

const tracer = trace.getTracer('push-notifications', '1.0.0')

export interface InstrumentedNotificationPayload {
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'alert'
  category: string
  actionUrl?: string
  priority?: 'low' | 'medium' | 'high'
  sound?: boolean
}

/**
 * Instrument push notification send operation
 */
export function instrumentNotificationSend(payload: InstrumentedNotificationPayload) {
  const span = tracer.startSpan('notification.send', {
    attributes: {
      'notification.title': payload.title,
      'notification.message': payload.message,
      'notification.type': payload.type,
      'notification.category': payload.category,
      'notification.priority': payload.priority || 'medium',
      'notification.hasActionUrl': !!payload.actionUrl,
      'notification.sound': payload.sound || false,
    },
  })
  
  return span
}

/**
 * Instrument push notification browser API delivery
 */
export function instrumentPushNotificationBrowser(
  title: string,
  options: NotificationOptions,
  category: string,
) {
  const span = tracer.startSpan('notification.channel.push', {
    attributes: {
      'notification.channel': 'push',
      'notification.title': title,
      'notification.category': category,
      'notification.browser.api': 'Notification',
      'notification.browser.requireInteraction': options.requireInteraction || false,
      'notification.browser.hasIcon': !!options.icon,
      'notification.browser.hasBadge': !!options.badge,
    },
  })

  return span
}

/**
 * Instrument email notification channel
 */
export function instrumentEmailNotificationChannel(
  title: string,
  category: string,
  recipient?: string,
) {
  const span = tracer.startSpan('notification.channel.email', {
    attributes: {
      'notification.channel': 'email',
      'notification.title': title,
      'notification.category': category,
      ...(recipient && { 'notification.email.recipient': recipient }),
    },
  })

  return span
}

/**
 * Instrument SMS notification channel
 */
export function instrumentSmsNotificationChannel(
  title: string,
  category: string,
  phoneNumber?: string,
) {
  const span = tracer.startSpan('notification.channel.sms', {
    attributes: {
      'notification.channel': 'sms',
      'notification.title': title,
      'notification.category': category,
      ...(phoneNumber && { 'notification.sms.phoneNumber': phoneNumber }),
    },
  })

  return span
}

/**
 * Instrument in-app notification display
 */
export function instrumentInAppNotification(
  title: string,
  category: string,
) {
  const span = tracer.startSpan('notification.channel.inapp', {
    attributes: {
      'notification.channel': 'inapp',
      'notification.title': title,
      'notification.category': category,
    },
  })

  return span
}

/**
 * Instrument notification permission request
 */
export function instrumentNotificationPermissionRequest() {
  const span = tracer.startSpan('notification.permission.request', {
    attributes: {
      'notification.permission.action': 'request',
    },
  })

  return span
}

/**
 * Record notification permission status
 */
export function recordNotificationPermissionStatus(
  span: ReturnType<typeof tracer.startSpan>,
  supported: boolean,
  status?: NotificationPermission,
) {
  span.setAttribute('notification.permission.supported', supported)
  if (status) {
    span.setAttribute('notification.permission.status', status)
  }
}

/**
 * Instrument notification click/interaction
 */
export function instrumentNotificationInteraction(
  category: string,
  actionType: 'click' | 'close' | 'error',
) {
  const span = tracer.startSpan('notification.interaction', {
    attributes: {
      'notification.interaction.type': actionType,
      'notification.category': category,
    },
  })

  return span
}

/**
 * Instrument notification queue operation
 */
export function instrumentNotificationQueueOperation(
  operation: 'enqueue' | 'dequeue' | 'process',
  queueSize: number,
) {
  const span = tracer.startSpan('notification.queue', {
    attributes: {
      'notification.queue.operation': operation,
      'notification.queue.size': queueSize,
    },
  })

  return span
}

/**
 * Helper to safely execute and span an operation
 */
export async function withNotificationSpan<T>(
  span: ReturnType<typeof tracer.startSpan>,
  operation: () => Promise<T> | T,
): Promise<T> {
  try {
    const result = await Promise.resolve(operation())
    span.setStatus({ code: SpanStatusCode.OK })
    return result
  } catch (error) {
    span.recordException(error as Error)
    span.setStatus({ code: SpanStatusCode.ERROR })
    throw error
  } finally {
    span.end()
  }
}

/**
 * Helper to execute operation with context
 */
export async function withNotificationContext<T>(
  span: ReturnType<typeof tracer.startSpan>,
  operation: () => Promise<T> | T,
): Promise<T> {
  return context.with(trace.setSpan(context.active(), span), () =>
    withNotificationSpan(span, operation),
  )
}
