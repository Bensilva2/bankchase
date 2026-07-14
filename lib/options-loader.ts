// Options loader for managing application-wide options and configuration

export interface AppOption {
  id: string;
  label: string;
  value: string | number | boolean;
  category: string;
  enabled?: boolean;
}

export interface OptionsConfig {
  accountTypes: AppOption[];
  transactionTypes: AppOption[];
  billCategories: AppOption[];
  cardTypes: AppOption[];
  currencies: AppOption[];
  frequencies: AppOption[];
  notificationTypes: AppOption[];
  securityOptions: AppOption[];
}

// Default options configuration
const defaultOptions: OptionsConfig = {
  accountTypes: [
    { id: "checking", label: "Checking Account", value: "checking", category: "account", enabled: true },
    { id: "savings", label: "Savings Account", value: "savings", category: "account", enabled: true },
    { id: "money_market", label: "Money Market", value: "money_market", category: "account", enabled: true },
    { id: "cd", label: "Certificate of Deposit", value: "cd", category: "account", enabled: true },
    { id: "ira", label: "IRA Account", value: "ira", category: "account", enabled: true },
    { id: "brokerage", label: "Brokerage Account", value: "brokerage", category: "account", enabled: true },
  ],
  transactionTypes: [
    { id: "transfer", label: "Transfer", value: "transfer", category: "transaction", enabled: true },
    { id: "deposit", label: "Deposit", value: "deposit", category: "transaction", enabled: true },
    { id: "withdrawal", label: "Withdrawal", value: "withdrawal", category: "transaction", enabled: true },
    { id: "payment", label: "Payment", value: "payment", category: "transaction", enabled: true },
    { id: "wire", label: "Wire Transfer", value: "wire", category: "transaction", enabled: true },
    { id: "check", label: "Check", value: "check", category: "transaction", enabled: true },
    { id: "ach", label: "ACH Transfer", value: "ach", category: "transaction", enabled: true },
  ],
  billCategories: [
    { id: "utilities", label: "Utilities", value: "utilities", category: "bill", enabled: true },
    { id: "insurance", label: "Insurance", value: "insurance", category: "bill", enabled: true },
    { id: "mortgage", label: "Mortgage", value: "mortgage", category: "bill", enabled: true },
    { id: "rent", label: "Rent", value: "rent", category: "bill", enabled: true },
    { id: "healthcare", label: "Healthcare", value: "healthcare", category: "bill", enabled: true },
    { id: "education", label: "Education", value: "education", category: "bill", enabled: true },
    { id: "subscription", label: "Subscription", value: "subscription", category: "bill", enabled: true },
  ],
  cardTypes: [
    { id: "debit", label: "Debit Card", value: "debit", category: "card", enabled: true },
    { id: "credit", label: "Credit Card", value: "credit", category: "card", enabled: true },
    { id: "prepaid", label: "Prepaid Card", value: "prepaid", category: "card", enabled: true },
    { id: "business", label: "Business Card", value: "business", category: "card", enabled: true },
  ],
  currencies: [
    { id: "usd", label: "US Dollar (USD)", value: "usd", category: "currency", enabled: true },
    { id: "eur", label: "Euro (EUR)", value: "eur", category: "currency", enabled: true },
    { id: "gbp", label: "British Pound (GBP)", value: "gbp", category: "currency", enabled: true },
    { id: "jpy", label: "Japanese Yen (JPY)", value: "jpy", category: "currency", enabled: true },
    { id: "cad", label: "Canadian Dollar (CAD)", value: "cad", category: "currency", enabled: true },
    { id: "aud", label: "Australian Dollar (AUD)", value: "aud", category: "currency", enabled: true },
  ],
  frequencies: [
    { id: "once", label: "One-time", value: "once", category: "frequency", enabled: true },
    { id: "daily", label: "Daily", value: "daily", category: "frequency", enabled: true },
    { id: "weekly", label: "Weekly", value: "weekly", category: "frequency", enabled: true },
    { id: "biweekly", label: "Bi-weekly", value: "biweekly", category: "frequency", enabled: true },
    { id: "monthly", label: "Monthly", value: "monthly", category: "frequency", enabled: true },
    { id: "quarterly", label: "Quarterly", value: "quarterly", category: "frequency", enabled: true },
    { id: "annually", label: "Annually", value: "annually", category: "frequency", enabled: true },
  ],
  notificationTypes: [
    { id: "email", label: "Email", value: "email", category: "notification", enabled: true },
    { id: "sms", label: "Text Message", value: "sms", category: "notification", enabled: true },
    { id: "push", label: "Push Notification", value: "push", category: "notification", enabled: true },
    { id: "in_app", label: "In-App", value: "in_app", category: "notification", enabled: true },
  ],
  securityOptions: [
    { id: "twofa", label: "Two-Factor Authentication", value: "twofa", category: "security", enabled: true },
    { id: "biometric", label: "Biometric Login", value: "biometric", category: "security", enabled: true },
    { id: "pin", label: "PIN Protection", value: "pin", category: "security", enabled: true },
    { id: "security_questions", label: "Security Questions", value: "security_questions", category: "security", enabled: true },
  ],
};

// Cache for loaded options
let optionsCache: OptionsConfig | null = null;

/**
 * Load options from API or use defaults
 */
export async function loadOptions(): Promise<OptionsConfig> {
  try {
    // Return cached options if available
    if (optionsCache) {
      console.log("[v0] Returning cached options");
      return optionsCache;
    }

    // Try to fetch from API
    try {
      const response = await fetch("/api/options", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        // Don't cache API requests
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        optionsCache = data;
        console.log("[v0] Loaded options from API");
        return data;
      }
    } catch (apiError) {
      console.warn("[v0] Failed to load options from API, using defaults:", apiError);
    }

    // Use defaults if API fails
    optionsCache = defaultOptions;
    return defaultOptions;
  } catch (error) {
    console.error("[v0] Error loading options:", error);
    return defaultOptions;
  }
}

/**
 * Get options by category
 */
export function getOptionsByCategory(options: OptionsConfig, category: string): AppOption[] {
  const allOptions = Object.values(options).flat();
  return allOptions.filter((opt) => opt.category === category && opt.enabled !== false);
}

/**
 * Get single option by id
 */
export function getOptionById(options: OptionsConfig, id: string): AppOption | undefined {
  const allOptions = Object.values(options).flat();
  return allOptions.find((opt) => opt.id === id);
}

/**
 * Clear options cache
 */
export function clearOptionsCache(): void {
  optionsCache = null;
  console.log("[v0] Options cache cleared");
}

/**
 * Reload options from source
 */
export async function reloadOptions(): Promise<OptionsConfig> {
  clearOptionsCache();
  return loadOptions();
}

/**
 * Get all options
 */
export function getAllOptions(options: OptionsConfig): AppOption[] {
  return Object.values(options).flat().filter((opt) => opt.enabled !== false);
}

/**
 * Validate option exists
 */
export function isValidOption(options: OptionsConfig, optionId: string): boolean {
  const option = getOptionById(options, optionId);
  return option !== undefined && option.enabled !== false;
}

/**
 * Get default options (not cached)
 */
export function getDefaultOptions(): OptionsConfig {
  return JSON.parse(JSON.stringify(defaultOptions));
}
