/**
 * Link Validation Utilities
 * Ensures all Link components receive valid href values
 */

/**
 * MenuItem interface - used for Link-based menu items
 */
export interface MenuItem {
  id?: string;
  href: string;
  label: string;
  [key: string]: unknown; // Allow additional properties
}

/**
 * Validates if a value is a valid MenuItem
 * @param value - The value to validate
 * @returns true if value is a valid MenuItem
 */
export function isValidMenuItem(value: unknown): value is MenuItem {
  // Check if it's an object
  if (typeof value !== 'object' || value === null) {
    console.warn('[MenuItem Validation] Value is not an object:', value);
    return false;
  }

  const item = value as Record<string, unknown>;

  // Check href property
  if (!('href' in item)) {
    console.warn('[MenuItem Validation] Missing href property');
    return false;
  }

  if (typeof item.href !== 'string') {
    console.warn('[MenuItem Validation] href is not a string:', item.href);
    return false;
  }

  if (item.href.trim().length === 0) {
    console.warn('[MenuItem Validation] href is empty string');
    return false;
  }

  // Check label property
  if (!('label' in item)) {
    console.warn('[MenuItem Validation] Missing label property');
    return false;
  }

  if (typeof item.label !== 'string') {
    console.warn('[MenuItem Validation] label is not a string:', item.label);
    return false;
  }

  return true;
}

/**
 * Validates and filters an array of items
 * @param items - Array to validate
 * @param options - Validation options
 * @returns Array of valid MenuItems
 */
export function validateMenuItems(
  items: unknown,
  options: {
    logWarnings?: boolean;
    fallbackHref?: string;
    strict?: boolean;
  } = {}
): MenuItem[] {
  const {
    logWarnings = true,
    fallbackHref = '/',
    strict = true,
  } = options;

  // Check if items is an array
  if (!Array.isArray(items)) {
    if (logWarnings) {
      console.warn('[validateMenuItems] Input is not an array:', typeof items);
    }
    return [];
  }

  // Filter valid items
  const validItems: MenuItem[] = [];

  items.forEach((item, index) => {
    try {
      if (isValidMenuItem(item)) {
        validItems.push(item);
      } else {
        if (logWarnings) {
          console.warn(
            `[validateMenuItems] Item at index ${index} is invalid:`,
            item
          );
        }
        // In non-strict mode, try to salvage the item
        if (!strict && typeof item === 'object' && item !== null) {
          const salvaged = salvageMenuItem(item);
          if (salvaged) {
            validItems.push(salvaged);
          }
        }
      }
    } catch (error) {
      if (logWarnings) {
        console.error(
          `[validateMenuItems] Error validating item at index ${index}:`,
          error
        );
      }
    }
  });

  if (validItems.length === 0 && logWarnings) {
    console.warn('[validateMenuItems] No valid items found in array');
  }

  return validItems;
}

/**
 * Attempts to salvage an invalid item by mapping common property names
 * @param item - The item to salvage
 * @returns Salvaged MenuItem or null
 */
function salvageMenuItem(item: Record<string, unknown>): MenuItem | null {
  const salvaged: Partial<MenuItem> = {};

  // Map common href property names
  const hrefKeys = ['href', 'url', 'path', 'link', 'to'];
  for (const key of hrefKeys) {
    if (key in item && typeof item[key] === 'string') {
      salvaged.href = item[key] as string;
      break;
    }
  }

  // Map common label property names
  const labelKeys = ['label', 'title', 'name', 'text'];
  for (const key of labelKeys) {
    if (key in item && typeof item[key] === 'string') {
      salvaged.label = item[key] as string;
      break;
    }
  }

  // Only return if we found both href and label
  if (salvaged.href && salvaged.label) {
    return salvaged as MenuItem;
  }

  return null;
}

/**
 * Safely gets href value with fallback
 * @param item - The item to get href from
 * @param fallback - Fallback href value
 * @returns href string
 */
export function getHrefSafely(
  item: unknown,
  fallback: string = '/'
): string {
  if (item === null || item === undefined) {
    return fallback;
  }

  if (typeof item === 'string') {
    return item.trim().length > 0 ? item : fallback;
  }

  if (typeof item === 'object') {
    const obj = item as Record<string, unknown>;
    const href = obj.href ?? obj.url ?? obj.path ?? obj.to;

    if (typeof href === 'string') {
      return href.trim().length > 0 ? href : fallback;
    }
  }

  return fallback;
}

/**
 * Creates a validation wrapper for Link components
 * @param href - The href value to validate
 * @returns Validated href or fallback
 */
export function validateHref(href: unknown): string {
  if (typeof href === 'string' && href.trim().length > 0) {
    // Ensure href starts with /
    return href.startsWith('/') || href.startsWith('http')
      ? href
      : `/${href}`;
  }

  console.warn('[validateHref] Invalid href:', href);
  return '/';
}

/**
 * Validates a single item and provides detailed error info
 * @param item - Item to validate
 * @returns Validation result with details
 */
export function validateItemDetailed(
  item: unknown
): {
  isValid: boolean;
  errors: string[];
  item: MenuItem | null;
} {
  const errors: string[] = [];

  // Check if it's an object
  if (typeof item !== 'object' || item === null) {
    errors.push('Item is not an object');
    return { isValid: false, errors, item: null };
  }

  const obj = item as Record<string, unknown>;

  // Validate href
  if (!('href' in obj)) {
    errors.push('Missing "href" property');
  } else if (typeof obj.href !== 'string') {
    errors.push(`href is not a string (got ${typeof obj.href})`);
  } else if (obj.href.trim().length === 0) {
    errors.push('href is an empty string');
  }

  // Validate label
  if (!('label' in obj)) {
    errors.push('Missing "label" property');
  } else if (typeof obj.label !== 'string') {
    errors.push(`label is not a string (got ${typeof obj.label})`);
  } else if (obj.label.trim().length === 0) {
    errors.push('label is an empty string');
  }

  if (errors.length === 0 && isValidMenuItem(item)) {
    return { isValid: true, errors: [], item: item as MenuItem };
  }

  return { isValid: false, errors, item: null };
}

/**
 * Creates a safe menu item with all checks
 * @param href - href value
 * @param label - label value
 * @param id - optional id
 * @returns MenuItem or null if invalid
 */
export function createMenuItem(
  href: unknown,
  label: unknown,
  id?: string
): MenuItem | null {
  const validatedHref = validateHref(href);
  const validatedLabel =
    typeof label === 'string' ? label.trim() : `Item`;

  if (!validatedHref || !validatedLabel) {
    return null;
  }

  return {
    id: id || `${Date.now()}-${Math.random()}`,
    href: validatedHref,
    label: validatedLabel,
  };
}

/**
 * Real-time validator for menu items with live data
 * Useful for data that updates frequently
 */
export class MenuItemValidator {
  private lastValidationTime = 0;
  private validationCache = new Map<string, boolean>();

  /**
   * Validates items and caches results
   */
  validateWithCache(items: unknown): MenuItem[] {
    const now = Date.now();

    // Clear cache every 5 minutes
    if (now - this.lastValidationTime > 300000) {
      this.validationCache.clear();
      this.lastValidationTime = now;
    }

    if (!Array.isArray(items)) {
      return [];
    }

    const validItems: MenuItem[] = [];

    items.forEach((item) => {
      const itemKey = JSON.stringify(item);

      // Check cache
      if (this.validationCache.has(itemKey)) {
        const isCached = this.validationCache.get(itemKey);
        if (isCached && isValidMenuItem(item)) {
          validItems.push(item);
        }
        return;
      }

      // Validate and cache
      if (isValidMenuItem(item)) {
        this.validationCache.set(itemKey, true);
        validItems.push(item);
      } else {
        this.validationCache.set(itemKey, false);
      }
    });

    return validItems;
  }

  clearCache(): void {
    this.validationCache.clear();
  }
}
