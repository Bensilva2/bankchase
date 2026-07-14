/**
 * Statsig Tracking Utilities
 * 
 * Helper functions and hooks for consistent event tracking
 * and feature gate management throughout the application.
 */

import { ANALYTICS_EVENTS, AnalyticsEventName } from "./statsig-integration";

/**
 * Standard metadata structure for events
 */
export interface EventMetadata {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Transaction event metadata
 */
export interface TransactionEventMetadata extends EventMetadata {
  transactionId?: string;
  accountId?: string;
  recipientId?: string;
  type?: "transfer" | "payment" | "deposit" | "withdrawal";
  status?: "pending" | "completed" | "failed" | "cancelled";
  method?: "internal" | "external" | "card" | "ach";
  timestamp?: string;
}

/**
 * User interaction event metadata
 */
export interface UserInteractionMetadata extends EventMetadata {
  component?: string;
  action?: string;
  value?: string | number;
  context?: string;
}

/**
 * Error event metadata
 */
export interface ErrorEventMetadata extends EventMetadata {
  errorCode?: string;
  errorMessage?: string;
  component?: string;
  severity?: "info" | "warning" | "error" | "critical";
  timestamp?: string;
}

/**
 * Track transaction events
 * @param logEvent The logEvent function from useStatsig
 * @param event The type of transaction event
 * @param amount The transaction amount
 * @param metadata Additional context about the transaction
 */
export function trackTransactionEvent(
  logEvent: (eventName: string, value?: number | string, metadata?: EventMetadata) => void,
  event: AnalyticsEventName,
  amount: number,
  metadata?: TransactionEventMetadata
) {
  logEvent(event, amount, {
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Track user interactions
 * @param logEvent The logEvent function from useStatsig
 * @param action The user action
 * @param metadata Additional context
 */
export function trackUserInteraction(
  logEvent: (eventName: string, value?: number | string, metadata?: EventMetadata) => void,
  action: AnalyticsEventName,
  metadata?: UserInteractionMetadata
) {
  logEvent(action, 1, {
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Track error events
 * @param logEvent The logEvent function from useStatsig
 * @param error The error that occurred
 * @param metadata Additional error context
 */
export function trackErrorEvent(
  logEvent: (eventName: string, value?: number | string, metadata?: EventMetadata) => void,
  error: Error,
  metadata?: ErrorEventMetadata
) {
  logEvent(ANALYTICS_EVENTS.ERROR_ENCOUNTERED, 1, {
    errorCode: error.name,
    errorMessage: error.message,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Track page view
 * @param logEvent The logEvent function from useStatsig
 * @param pageName The page that was viewed
 * @param metadata Additional context
 */
export function trackPageView(
  logEvent: (eventName: string, value?: number | string, metadata?: EventMetadata) => void,
  pageName: string,
  metadata?: EventMetadata
) {
  logEvent(ANALYTICS_EVENTS.PAGE_VIEWED, 1, {
    page: pageName,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Track feature access
 * @param logEvent The logEvent function from useStatsig
 * @param featureName The feature that was accessed
 * @param metadata Additional context
 */
export function trackFeatureAccess(
  logEvent: (eventName: string, value?: number | string, metadata?: EventMetadata) => void,
  featureName: string,
  metadata?: EventMetadata
) {
  logEvent(ANALYTICS_EVENTS.FEATURE_ACCESSED, 1, {
    feature: featureName,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Track button click
 * @param logEvent The logEvent function from useStatsig
 * @param buttonName The button that was clicked
 * @param metadata Additional context
 */
export function trackButtonClick(
  logEvent: (eventName: string, value?: number | string, metadata?: EventMetadata) => void,
  buttonName: string,
  metadata?: EventMetadata
) {
  logEvent(ANALYTICS_EVENTS.BUTTON_CLICKED, 1, {
    buttonName,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Track form submission
 * @param logEvent The logEvent function from useStatsig
 * @param formName The form that was submitted
 * @param metadata Additional context
 */
export function trackFormSubmission(
  logEvent: (eventName: string, value?: number | string, metadata?: EventMetadata) => void,
  formName: string,
  metadata?: EventMetadata
) {
  logEvent(ANALYTICS_EVENTS.FORM_SUBMITTED, 1, {
    formName,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Track authentication events
 * @param logEvent The logEvent function from useStatsig
 * @param event The authentication event (login/logout/failed)
 * @param metadata Additional context
 */
export function trackAuthEvent(
  logEvent: (eventName: string, value?: number | string, metadata?: EventMetadata) => void,
  event: "login" | "logout" | "failed",
  metadata?: EventMetadata
) {
  const eventName =
    event === "login"
      ? ANALYTICS_EVENTS.USER_LOGIN
      : event === "logout"
        ? ANALYTICS_EVENTS.USER_LOGOUT
        : ANALYTICS_EVENTS.LOGIN_FAILED;

  logEvent(eventName, 1, {
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Create a performance tracker
 * @param logEvent The logEvent function from useStatsig
 * @param pageName The page being tracked
 * @returns Function to call when measuring is complete
 */
export function createPerformanceTracker(
  logEvent: (eventName: string, value?: number | string, metadata?: EventMetadata) => void,
  pageName: string
) {
  const startTime = performance.now();

  return () => {
    const duration = Math.round(performance.now() - startTime);
    logEvent(ANALYTICS_EVENTS.TIME_SPENT, duration, {
      page: pageName,
      timestamp: new Date().toISOString(),
    });
  };
}

/**
 * HOC to add Statsig tracking to a component
 * @param Component The component to wrap
 * @param trackingName The name for tracking
 * @returns Wrapped component
 */
export function withStatsigTracking<P extends object>(
  Component: React.ComponentType<P>,
  trackingName: string
) {
  return function WithStatsigTrackingComponent(props: P) {
    // Wrap with tracking logic here
    // This would typically track component mount and unmount
    return <Component {...props} />;
  };
}
