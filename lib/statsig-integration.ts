/**
 * Statsig Integration Examples and Utilities
 * 
 * This file demonstrates how to use Statsig for:
 * - Feature gates (feature flags)
 * - Dynamic configs (A/B testing)
 * - Custom events (analytics)
 * - Experiments
 */

// Feature Gate Examples
export const FEATURE_GATES = {
  NEW_DASHBOARD: "new_dashboard_layout",
  ADVANCED_ANALYTICS: "advanced_spending_analytics",
  BETA_REWARDS: "beta_rewards_system",
  DARK_MODE: "dark_mode_enabled",
  EXPERIMENTAL_TRANSACTIONS: "experimental_transfer_ui",
};

// Dynamic Config Examples
export const DYNAMIC_CONFIGS = {
  TRANSFER_LIMITS: "transfer_limits_config",
  NOTIFICATION_SETTINGS: "notification_preferences",
  UI_THEME: "ui_theme_config",
  FEATURE_FLAGS_ROLLOUT: "feature_flags_rollout",
};

// Custom Event Names
export const ANALYTICS_EVENTS = {
  // Authentication
  USER_LOGIN: "user_login",
  USER_LOGOUT: "user_logout",
  LOGIN_FAILED: "login_failed",

  // Transactions
  TRANSACTION_INITIATED: "transaction_initiated",
  TRANSACTION_COMPLETED: "transaction_completed",
  TRANSACTION_CANCELLED: "transaction_cancelled",
  TRANSACTION_FAILED: "transaction_failed",

  // Navigation
  PAGE_VIEWED: "page_viewed",
  FEATURE_ACCESSED: "feature_accessed",

  // User Interactions
  BUTTON_CLICKED: "button_clicked",
  FORM_SUBMITTED: "form_submitted",
  ERROR_ENCOUNTERED: "error_encountered",

  // Engagement
  SESSION_START: "session_start",
  SESSION_END: "session_end",
  TIME_SPENT: "time_spent_on_page",
};

/**
 * Example usage in components:
 * 
 * "use client";
 * import { useStatsig } from "@/hooks/use-statsig";
 * 
 * export function MyComponent() {
 *   const { checkFeatureGate, logEvent, getDynamicConfig } = useStatsig();
 * 
 *   // Check if a feature is enabled
 *   const showNewDashboard = checkFeatureGate(FEATURE_GATES.NEW_DASHBOARD);
 * 
 *   // Log an event
 *   const handleClick = () => {
 *     logEvent(ANALYTICS_EVENTS.BUTTON_CLICKED, 1, { buttonName: "submit" });
 *   };
 * 
 *   // Get dynamic config
 *   const config = getDynamicConfig(DYNAMIC_CONFIGS.TRANSFER_LIMITS);
 * 
 *   return (
 *     <div>
 *       {showNewDashboard ? <NewDashboard /> : <OldDashboard />}
 *       <button onClick={handleClick}>Click Me</button>
 *     </div>
 *   );
 * }
 */

// Experiment tracking helper
export interface ExperimentVariant {
  name: string;
  value: string;
  isUserInExperiment: boolean;
  primaryExposure: {
    gate?: string;
    experiment?: string;
    layer?: string;
    ruleID?: string;
  };
}

/**
 * Example experiment component wrapper:
 * 
 * export function ExperimentWrapper({ experimentName, children }) {
 *   const { getExperiment } = useStatsig();
 *   const experiment = getExperiment(experimentName);
 * 
 *   return (
 *     <div data-experiment={experiment?.name} data-group={experiment?.getGroupName()}>
 *       {children}
 *     </div>
 *   );
 * }
 */

// Type definitions for better TypeScript support
export type FeatureGateName = (typeof FEATURE_GATES)[keyof typeof FEATURE_GATES];
export type DynamicConfigName = (typeof DYNAMIC_CONFIGS)[keyof typeof DYNAMIC_CONFIGS];
export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
