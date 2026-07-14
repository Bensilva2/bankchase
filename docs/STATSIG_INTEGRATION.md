# Statsig Integration Guide

Complete setup and usage guide for Statsig analytics, feature gates, and experimentation in the BankChase application.

## Overview

Statsig provides:
- **Feature Gates** - Control feature rollouts and A/B testing
- **Dynamic Configs** - Manage user-specific configurations
- **Custom Events** - Track user interactions and behaviors
- **Experiments** - Run experiments with statistical significance
- **Session Replay** - Record and replay user sessions for debugging
- **Auto-capture** - Automatic event capture for common interactions

## Setup

### 1. Environment Variables

Add to `.env.local`:

```bash
# Required - Get from https://statsig.com
NEXT_PUBLIC_STATSIG_CLIENT_KEY=client-YOUR_KEY_HERE
```

### 2. Package Installation

Packages are already installed:
```bash
@statsig/react-bindings
@statsig/session-replay
@statsig/web-analytics
```

### 3. Provider Integration

The `StatsigWrapper` is already integrated in `app/layout.tsx` and includes:
- Auto-capture plugin (tracks page views, clicks, form submissions)
- Session replay plugin (records user sessions)
- User ID persistence in sessionStorage

## Usage

### Using the Hook

```typescript
'use client';

import { useStatsig } from "@/hooks/use-statsig";
import { FEATURE_GATES, ANALYTICS_EVENTS, DYNAMIC_CONFIGS } from "@/lib/statsig-integration";

export function MyComponent() {
  const { checkFeatureGate, logEvent, getDynamicConfig, getExperiment } = useStatsig();

  // Check feature gate
  const showNewUI = checkFeatureGate(FEATURE_GATES.NEW_DASHBOARD);

  // Log event
  const handleAction = () => {
    logEvent(ANALYTICS_EVENTS.BUTTON_CLICKED, 1, {
      buttonName: "submit",
      context: "form"
    });
  };

  // Get dynamic config
  const config = getDynamicConfig(DYNAMIC_CONFIGS.TRANSFER_LIMITS);
  const limit = config?.get("max_amount", 10000);

  // Get experiment variant
  const experiment = getExperiment("checkout_redesign");
  const variant = experiment?.getGroupName();

  return (
    <div>
      {showNewUI ? (
        <NewDashboard transferLimit={limit} />
      ) : (
        <OldDashboard />
      )}
      <button onClick={handleAction}>Submit</button>
    </div>
  );
}
```

### Feature Gates

Feature gates are defined in `lib/statsig-integration.ts`:

```typescript
export const FEATURE_GATES = {
  NEW_DASHBOARD: "new_dashboard_layout",
  ADVANCED_ANALYTICS: "advanced_spending_analytics",
  BETA_REWARDS: "beta_rewards_system",
  DARK_MODE: "dark_mode_enabled",
  EXPERIMENTAL_TRANSACTIONS: "experimental_transfer_ui",
};
```

### Custom Events

Track user interactions:

```typescript
const { logEvent } = useStatsig();

// Simple event
logEvent(ANALYTICS_EVENTS.PAGE_VIEWED);

// Event with value
logEvent(ANALYTICS_EVENTS.TRANSACTION_COMPLETED, 500); // $500 transaction

// Event with metadata
logEvent(ANALYTICS_EVENTS.TRANSACTION_COMPLETED, 500, {
  account: "checking",
  recipient: "external",
  method: "transfer"
});
```

### Dynamic Configs

Manage configurations per user:

```typescript
const { getDynamicConfig } = useStatsig();

const config = getDynamicConfig(DYNAMIC_CONFIGS.TRANSFER_LIMITS);

// With defaults
const maxTransfer = config?.get("max_amount", 100000);
const dailyLimit = config?.get("daily_limit", 250000);
const requiresVerification = config?.get("requires_verification", false);
```

### Experiments

Run A/B tests:

```typescript
const { getExperiment, logEvent } = useStatsig();

const experiment = getExperiment("new_checkout_flow");
const isInExperiment = experiment?.isUserInExperiment;
const variant = experiment?.getGroupName();

if (variant === "treatment") {
  // Show new checkout flow
  logEvent("checkout_variant_shown", 1, { variant: "new" });
} else {
  // Show control checkout flow
  logEvent("checkout_variant_shown", 1, { variant: "control" });
}
```

## Implementation Examples

### 1. Transaction Flow with Analytics

```typescript
'use client';

import { useStatsig } from "@/hooks/use-statsig";
import { ANALYTICS_EVENTS, FEATURE_GATES } from "@/lib/statsig-integration";

export function TransactionForm() {
  const { logEvent, checkFeatureGate } = useStatsig();
  const [amount, setAmount] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    logEvent(ANALYTICS_EVENTS.TRANSACTION_INITIATED, amount, {
      type: "transfer",
      timestamp: new Date().toISOString()
    });

    try {
      const result = await submitTransaction(amount);
      logEvent(ANALYTICS_EVENTS.TRANSACTION_COMPLETED, amount, {
        transactionId: result.id,
        status: "success"
      });
    } catch (error) {
      logEvent(ANALYTICS_EVENTS.TRANSACTION_FAILED, amount, {
        error: error.message
      });
    }
  };

  if (!checkFeatureGate(FEATURE_GATES.EXPERIMENTAL_TRANSACTIONS)) {
    return <LegacyTransactionForm />;
  }

  return <NewTransactionForm onSubmit={handleSubmit} />;
}
```

### 2. Feature Rollout

```typescript
'use client';

import { useStatsig } from "@/hooks/use-statsig";
import { FEATURE_GATES } from "@/lib/statsig-integration";

export function Dashboard() {
  const { checkFeatureGate } = useStatsig();

  return (
    <div>
      {checkFeatureGate(FEATURE_GATES.NEW_DASHBOARD) && (
        <div>
          <h1>New Dashboard</h1>
          {checkFeatureGate(FEATURE_GATES.ADVANCED_ANALYTICS) && (
            <AdvancedAnalytics />
          )}
        </div>
      )}
      
      {!checkFeatureGate(FEATURE_GATES.NEW_DASHBOARD) && (
        <LegacyDashboard />
      )}
    </div>
  );
}
```

### 3. User Segmentation

Update user properties in `app/statsig-provider.tsx`:

```typescript
const { client } = useClientAsyncInit(
  process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY!,
  {
    userID: getUserID(),
    email: user?.email,
    customIDs: { 
      accountID: user?.accountId,
      orgID: user?.organizationId 
    },
    custom: {
      plan: user?.plan,
      country: user?.country,
      accountAge: calculateAccountAge(user?.createdAt),
      isVerified: user?.verified
    },
  },
  { /* options */ }
);
```

Then gate features by these properties in Statsig dashboard.

## Monitoring

### View Events in Statsig Console

1. Go to https://console.statsig.com
2. Navigate to "Logs" → "Event Stream"
3. Filter by event name or user ID
4. View real-time event data

### Session Replay

1. Go to "Session Replays" in console
2. Select a session to watch user interactions
3. Debug issues with visual replay

### Experiments

1. Create experiment in console
2. Define treatment and control groups
3. Monitor results with statistical significance
4. View funnel analysis and conversion metrics

## Common Patterns

### Global Error Tracking

```typescript
export function ErrorBoundary({ children }) {
  const { logEvent } = useStatsig();

  return (
    <ErrorBoundaryComponent
      onError={(error, info) => {
        logEvent(ANALYTICS_EVENTS.ERROR_ENCOUNTERED, 1, {
          error: error.message,
          component: info.componentStack,
          timestamp: new Date().toISOString()
        });
      }}
    >
      {children}
    </ErrorBoundaryComponent>
  );
}
```

### Session Tracking

```typescript
useEffect(() => {
  const { logEvent } = useStatsig();

  // Track session start
  logEvent(ANALYTICS_EVENTS.SESSION_START);

  // Track session end on unmount
  return () => {
    logEvent(ANALYTICS_EVENTS.SESSION_END);
  };
}, []);
```

### Performance Monitoring

```typescript
useEffect(() => {
  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;
    logEvent(ANALYTICS_EVENTS.TIME_SPENT, Math.round(duration), {
      page: location.pathname
    });
  };
}, []);
```

## Troubleshooting

### Events Not Showing Up

1. Check client key is correct in `.env.local`
2. Verify `NEXT_PUBLIC_` prefix for environment variable
3. Check browser console for errors
4. Wait 1-2 minutes for events to appear in dashboard

### Feature Gates Always False

1. Create gate in Statsig console
2. Add rules for target users/segments
3. Verify user ID is consistent

### Session Replay Not Working

1. Check session replay plugin is loaded
2. Verify no Content Security Policy restrictions
3. Check browser console for errors

## References

- [Statsig Documentation](https://docs.statsig.com)
- [React SDK Docs](https://docs.statsig.com/client/jsClientSDK)
- [Feature Gates Guide](https://docs.statsig.com/feature-gates)
- [Custom Events](https://docs.statsig.com/events)
- [Experiments](https://docs.statsig.com/experiments)
