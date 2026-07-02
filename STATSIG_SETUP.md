# Statsig SDK Integration Guide

## Overview

Statsig is integrated into the Chase Banking Application for feature management, A/B testing, and analytics. This guide explains how to use Statsig features throughout the app.

## Installation

The following packages have been installed:
- `@statsig/react-bindings` - React integration
- `@statsig/web-analytics` - Automatic event tracking
- `@statsig/session-replay` - Session recording (optional)

## Configuration

### Environment Variables

The Statsig client key is configured in `.env.local`:

```
NEXT_PUBLIC_STATSIG_CLIENT_KEY=client-AabxigkceJ4dyWPfW3laHvqlG60otAtKFZXPcyPgx5q
```

### Provider Setup

The `StatsigWrapper` component wraps the entire application in `app/layout.tsx`, making Statsig features available to all components.

## Usage

### 1. Using the `useStatsig` Hook

All client components can use the `useStatsig()` hook to access Statsig functionality:

```typescript
"use client";

import { useStatsig } from "@/hooks/use-statsig";
import { FEATURE_GATES, ANALYTICS_EVENTS } from "@/lib/statsig-integration";

export default function MyComponent() {
  const { checkFeatureGate, logEvent, getDynamicConfig } = useStatsig();

  // Check if feature is enabled
  const showNewDashboard = checkFeatureGate(FEATURE_GATES.NEW_DASHBOARD);

  // Log custom events
  const handleClick = () => {
    logEvent(ANALYTICS_EVENTS.BUTTON_CLICKED, 1, { 
      component: "MyComponent",
      action: "click" 
    });
  };

  return (
    <div>
      {showNewDashboard && <NewDashboardContent />}
      <button onClick={handleClick}>Click Me</button>
    </div>
  );
}
```

### 2. Feature Gates (Feature Flags)

Use feature gates to control feature rollout:

```typescript
const { checkFeatureGate } = useStatsig();

// Check if users should see new features
if (checkFeatureGate("advanced_analytics")) {
  // Show advanced analytics
} else {
  // Show basic analytics
}
```

### 3. Dynamic Configs

Use dynamic configs for A/B testing and configuration management:

```typescript
const { getDynamicConfig } = useStatsig();

const config = getDynamicConfig("transfer_limits_config");
const maxTransferAmount = config?.get("max_amount", 10000);
```

### 4. Custom Events

Log analytics events for tracking user behavior:

```typescript
const { logEvent } = useStatsig();

// Log transaction completion
logEvent("transaction_completed", 150.50, {
  transactionType: "transfer",
  recipientType: "internal",
});

// Log page view
logEvent("page_viewed", 1, { 
  page: "/spending",
  source: "navigation" 
});
```

### 5. Experiments

Track experiment variants for A/B tests:

```typescript
const { getExperiment } = useStatsig();

const experiment = getExperiment("checkout_ui_experiment");
const variant = experiment?.getGroupName();

if (variant === "variant_a") {
  return <CheckoutUIVariantA />;
} else {
  return <CheckoutUIVariantB />;
}
```

## Available Features

### Feature Gates
- `NEW_DASHBOARD` - New dashboard layout
- `ADVANCED_ANALYTICS` - Advanced spending analytics
- `BETA_REWARDS` - Beta rewards system
- `DARK_MODE` - Dark mode enabled
- `EXPERIMENTAL_TRANSACTIONS` - Experimental transfer UI

### Dynamic Configs
- `TRANSFER_LIMITS` - Transfer limits configuration
- `NOTIFICATION_SETTINGS` - Notification preferences
- `UI_THEME` - UI theme configuration
- `FEATURE_FLAGS_ROLLOUT` - Feature flags rollout configuration

### Analytics Events
- `USER_LOGIN` - User login event
- `TRANSACTION_INITIATED` - Transaction initiated
- `TRANSACTION_COMPLETED` - Transaction completed
- `PAGE_VIEWED` - Page view tracking
- `BUTTON_CLICKED` - Button click tracking
- And more (see `lib/statsig-integration.ts`)

## Statsig Console

To manage features, configure experiments, and view analytics:

1. Go to https://www.statsig.com
2. Log in with your account
3. Select the project
4. Configure feature gates, experiments, and dynamic configs
5. View analytics and user insights

## Best Practices

1. **Always check if the feature is enabled before showing it**
   ```typescript
   if (checkFeatureGate("new_feature")) {
     // Show new feature
   }
   ```

2. **Use meaningful event names**
   ```typescript
   logEvent("transaction_failed", 1, { 
     reason: "insufficient_funds",
     amount: 500 
   });
   ```

3. **Include user context when available**
   - User ID (automatically set by Statsig)
   - User email (optional)
   - Custom attributes (plan, country, etc.)

4. **Test feature gates locally**
   - Use the Statsig console to override gates for testing
   - Use different user IDs to test variations

5. **Monitor experiment results**
   - Check daily active users
   - Monitor key metrics
   - Compare control vs treatment groups

## Troubleshooting

### Features not loading
- Check that the Statsig client key is correct
- Verify `NEXT_PUBLIC_STATSIG_CLIENT_KEY` is set in `.env.local`
- Check browser console for errors

### Events not showing in Statsig console
- Wait a few seconds for events to propagate
- Check that `logEvent()` is being called
- Verify user ID is set correctly

### Feature gates always returning false
- Check that the gate name is correct
- Verify the gate is enabled in Statsig console
- Try using a different user ID

## Additional Resources

- [Statsig Documentation](https://docs.statsig.com)
- [React Bindings Docs](https://docs.statsig.com/client/react-bindings)
- [Feature Gates Guide](https://docs.statsig.com/guides/feature-gates)
- [Experiments Guide](https://docs.statsig.com/guides/experiments)

## API Reference

### useStatsig Hook

```typescript
interface UseStatsigReturn {
  logEvent(eventName: string, value?: string | number, metadata?: Record<string, any>): void;
  checkFeatureGate(gateName: string): boolean;
  getDynamicConfig(configName: string): DynamicConfig | null;
  getExperiment(experimentName: string): Experiment | null;
  client: StatsigClient;
}
```

### Integration Example

See `lib/statsig-integration.ts` for:
- Feature gate constants
- Dynamic config constants
- Analytics event names
- Example usage patterns
