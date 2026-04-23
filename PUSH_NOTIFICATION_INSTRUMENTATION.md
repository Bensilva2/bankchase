# Push Notification OpenTelemetry Instrumentation Guide

This guide explains how to use the new OpenTelemetry instrumentation for your push notification system.

## Overview

The instrumentation captures telemetry for:
- **Notification Lifecycle**: Send, queue, processing
- **Delivery Channels**: Push (browser), Email, SMS, In-App
- **User Interactions**: Clicks, closes, errors
- **Permissions**: Request status and browser support
- **Queue Management**: Enqueue, dequeue, processing operations

## Files Added

1. **lib/push-notification-instrumentation.ts** - Core instrumentation utilities
2. **lib/notification-manager-instrumented.ts** - Enhanced NotificationManager with tracing

## Span Types

### Notification Send
```
notification.send
├── notification.title: string
├── notification.message: string
├── notification.type: 'info' | 'warning' | 'success' | 'alert'
├── notification.category: string
├── notification.priority: 'low' | 'medium' | 'high'
├── notification.hasActionUrl: boolean
└── notification.sound: boolean
```

### Delivery Channels

#### Push (Browser Notification API)
```
notification.channel.push
├── notification.channel: 'push'
├── notification.title: string
├── notification.category: string
├── notification.browser.api: 'Notification'
├── notification.browser.requireInteraction: boolean
├── notification.browser.hasIcon: boolean
└── notification.browser.hasBadge: boolean
```

#### Email
```
notification.channel.email
├── notification.channel: 'email'
├── notification.title: string
├── notification.category: string
└── notification.email.recipient: string (optional)
```

#### SMS
```
notification.channel.sms
├── notification.channel: 'sms'
├── notification.title: string
├── notification.category: string
└── notification.sms.phoneNumber: string (optional)
```

#### In-App
```
notification.channel.inapp
├── notification.channel: 'inapp'
├── notification.title: string
└── notification.category: string
```

### User Interactions
```
notification.interaction
├── notification.interaction.type: 'click' | 'close' | 'error'
└── notification.category: string
```

### Permission Requests
```
notification.permission.request
├── notification.permission.action: 'request'
├── notification.permission.supported: boolean
└── notification.permission.status: 'granted' | 'denied' | 'default'
```

### Queue Operations
```
notification.queue
├── notification.queue.operation: 'enqueue' | 'dequeue' | 'process'
└── notification.queue.size: number
```

## Usage Examples

### Basic Integration

Replace your existing NotificationManager with InstrumentedNotificationManager:

```typescript
import { InstrumentedNotificationManager } from '@/lib/notification-manager-instrumented'

const notificationManager = new InstrumentedNotificationManager(
  (type) => userSettings.notifications[type].enabled,
  (notification) => addToInAppNotifications(notification),
)

// Send notification - automatically traces all channels
await notificationManager.send({
  title: 'Payment Successful',
  message: 'Your payment of $500 has been processed',
  type: 'success',
  category: 'payment',
  priority: 'high',
  actionUrl: '/transactions/123',
})
```

### Custom Instrumentation

If you need more granular control, use the instrumentation utilities directly:

```typescript
import {
  instrumentNotificationSend,
  instrumentPushNotificationBrowser,
  withNotificationContext,
} from '@/lib/push-notification-instrumentation'

async function sendNotification(payload) {
  const span = instrumentNotificationSend(payload)
  
  return withNotificationContext(span, async () => {
    // Your notification logic here
    const notification = new Notification(payload.title, {
      body: payload.message,
    })
    
    // The span context is automatically propagated
  })
}
```

### Request Permissions with Tracing

```typescript
async function requestNotificationPermission() {
  const hasPermission = await notificationManager.requestPermission()
  
  // All traces are automatically captured, including:
  // - Browser support detection
  // - Permission status
  // - User's response to permission prompt
  
  if (hasPermission) {
    // Send notifications with confidence
  }
}
```

## Dashboard Queries

### Find All Notification Sends
```
SELECT * FROM traces
WHERE SpanName = 'notification.send'
  AND Timestamp > now() - INTERVAL 1 DAY
ORDER BY Timestamp DESC
```

### Notification Success Rate by Channel
```
SELECT 
  Attributes['notification.channel'] as channel,
  countIf(Status = 'OK') as successes,
  countIf(Status = 'ERROR') as failures,
  round(countIf(Status = 'OK') / count() * 100, 2) as success_rate
FROM traces
WHERE SpanName LIKE 'notification.channel.%'
GROUP BY channel
```

### Most Common Notification Types
```
SELECT 
  Attributes['notification.type'] as type,
  count() as count
FROM traces
WHERE SpanName = 'notification.send'
GROUP BY type
ORDER BY count DESC
```

### User Interactions with Notifications
```
SELECT 
  Attributes['notification.category'] as category,
  Attributes['notification.interaction.type'] as action,
  count() as count
FROM traces
WHERE SpanName = 'notification.interaction'
GROUP BY category, action
ORDER BY count DESC
```

### Queue Performance
```
SELECT 
  Attributes['notification.queue.operation'] as operation,
  Attributes['notification.queue.size'] as queue_size,
  avg(DurationMs) as avg_duration_ms
FROM traces
WHERE SpanName = 'notification.queue'
GROUP BY operation, queue_size
ORDER BY avg_duration_ms DESC
```

### Permission Request Results
```
SELECT 
  Attributes['notification.permission.supported'] as supported,
  Attributes['notification.permission.status'] as status,
  count() as count
FROM traces
WHERE SpanName = 'notification.permission.request'
GROUP BY supported, status
```

## Integration Checklist

- [ ] Copy `lib/push-notification-instrumentation.ts` to your project
- [ ] Copy `lib/notification-manager-instrumented.ts` to your project
- [ ] Update your notification service to use `InstrumentedNotificationManager`
- [ ] Update components that call `notificationManager.send()` (no changes needed - API is the same)
- [ ] Update components that call `notificationManager.requestPermission()` (no changes needed)
- [ ] Deploy and verify traces appear in Kubiks dashboard
- [ ] Create custom dashboards for notification metrics

## Environment Variables

No additional environment variables are needed. The instrumentation will automatically use your existing OpenTelemetry configuration:

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=https://ingest.kubiks.app
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
OTEL_EXPORTER_OTLP_HEADERS=x-kubiks-key=YOUR_API_KEY
OTEL_SERVICE_NAME=v0-login-password-2
```

## Troubleshooting

### Spans Not Appearing

1. Verify OpenTelemetry is properly configured in `instrumentation.ts`
2. Check browser console for any JavaScript errors
3. Verify notification permissions are enabled in your browser
4. Check that spans are created with proper status (OK or ERROR)

### Missing Attributes

Ensure you're passing all required fields when calling `send()`:
- `title` - notification title
- `message` - notification message
- `type` - one of: 'info', 'warning', 'success', 'alert'
- `category` - used for filtering and grouping

### Performance Concerns

The instrumentation adds minimal overhead:
- Spans are lightweight and non-blocking
- Queue processing uses 100ms delays between notifications
- Exceptions are only recorded on errors

## Next Steps

1. **Monitor Notification Health**: Create dashboards showing success rates and user interactions
2. **Alert on Failures**: Set up alerts for notification channel failures
3. **Optimize Delivery**: Use queue size metrics to optimize notification batching
4. **Track User Engagement**: Monitor clicks vs. impressions for each notification category
5. **Performance Analysis**: Monitor span durations to identify bottlenecks

## Support

For questions or issues with the instrumentation, contact support@kubiks.ai
