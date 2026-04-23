/**
 * SafeLinkMenu Component
 * Safely renders menu items with Link components, handling undefined href values
 */

'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import {
  type MenuItem,
  validateMenuItems,
  getHrefSafely,
  isValidMenuItem,
} from '@/lib/link-validation';

/**
 * SafeLink Component
 * Renders a Link safely, falling back to span if href is invalid
 */
export interface SafeLinkProps {
  item: unknown;
  children?: ReactNode;
  className?: string;
  fallbackHref?: string;
  onInvalidItem?: (item: unknown) => void;
}

export function SafeLink({
  item,
  children,
  className = '',
  fallbackHref = '/',
  onInvalidItem,
}: SafeLinkProps) {
  // Validate item
  if (!isValidMenuItem(item)) {
    if (onInvalidItem) {
      onInvalidItem(item);
    }

    // Render as safe span instead of Link
    const label = typeof item === 'object' && item !== null 
      ? (item as Record<string, any>).label || 'Item'
      : 'Item';

    return (
      <span
        className={`text-muted-foreground cursor-not-allowed opacity-50 ${className}`}
        title="Invalid menu item - href is missing or invalid"
      >
        {children || label}
      </span>
    );
  }

  const href = getHrefSafely(item.href, fallbackHref);

  return (
    <Link href={href} className={className}>
      {children || item.label}
    </Link>
  );
}

/**
 * SafeLinkMenu Component
 * Renders a list of Link components safely, filtering invalid items
 */
export interface SafeLinkMenuProps {
  items: unknown;
  className?: string;
  itemClassName?: string;
  fallbackHref?: string;
  fallbackRenderer?: () => ReactNode;
  onValidationError?: (errors: Array<{ item: unknown; reason: string }>) => void;
  renderItem?: (item: MenuItem, index: number) => ReactNode;
}

export function SafeLinkMenu({
  items,
  className = 'space-y-2',
  itemClassName = 'block p-2 rounded-md hover:bg-muted transition-colors',
  fallbackHref = '/',
  fallbackRenderer,
  onValidationError,
  renderItem,
}: SafeLinkMenuProps) {
  // Validate all items
  const validItems = validateMenuItems(items, {
    logWarnings: true,
    fallbackHref,
  });

  // Track invalid items for error callback
  const allItems = Array.isArray(items) ? items : [];
  const invalidItems = allItems.filter(
    (item) => !isValidMenuItem(item)
  );

  if (invalidItems.length > 0 && onValidationError) {
    onValidationError(
      invalidItems.map((item) => ({
        item,
        reason: 'Missing or invalid href property',
      }))
    );
  }

  // Handle empty state
  if (validItems.length === 0) {
    if (fallbackRenderer) {
      return fallbackRenderer();
    }

    return (
      <div className="p-4 text-center text-muted-foreground">
        No valid menu items available
      </div>
    );
  }

  return (
    <nav className={className}>
      {validItems.map((item, index) => (
        <div key={item.id || `menu-item-${index}`}>
          {renderItem ? (
            renderItem(item, index)
          ) : (
            <SafeLink
              item={item}
              className={itemClassName}
            >
              {item.label}
            </SafeLink>
          )}
        </div>
      ))}
    </nav>
  );
}

/**
 * SafeLinkMenuWithValidation Component
 * Enhanced version with detailed validation feedback
 */
export interface SafeLinkMenuWithValidationProps
  extends SafeLinkMenuProps {
  showValidationErrors?: boolean;
  maxErrorsShown?: number;
}

export function SafeLinkMenuWithValidation({
  items,
  showValidationErrors = false,
  maxErrorsShown = 3,
  ...props
}: SafeLinkMenuWithValidationProps) {
  const validationErrors: Array<{ item: unknown; reason: string }> = [];

  const handleValidationError = (errors: Array<{ item: unknown; reason: string }>) => {
    validationErrors.push(...errors);
    if (props.onValidationError) {
      props.onValidationError(errors);
    }
  };

  return (
    <>
      <SafeLinkMenu
        items={items}
        {...props}
        onValidationError={handleValidationError}
      />

      {showValidationErrors && validationErrors.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="font-medium text-yellow-900 mb-2">
            Validation Errors ({validationErrors.length})
          </p>
          <ul className="text-sm text-yellow-800 space-y-1">
            {validationErrors.slice(0, maxErrorsShown).map((error, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-yellow-600 flex-shrink-0">•</span>
                <span>
                  {error.reason}
                  {typeof error.item === 'object' && error.item !== null
                    ? `: ${JSON.stringify(error.item).substring(0, 50)}...`
                    : ''}
                </span>
              </li>
            ))}
            {validationErrors.length > maxErrorsShown && (
              <li className="text-yellow-600">
                ... and {validationErrors.length - maxErrorsShown} more errors
              </li>
            )}
          </ul>
        </div>
      )}
    </>
  );
}

/**
 * Example Usage Component
 * Shows how to use SafeLinkMenu in practice
 */
export function SafeLinkMenuExample() {
  // Example 1: Valid items
  const validItems: MenuItem[] = [
    { id: '1', href: '/home', label: 'Home' },
    { id: '2', href: '/about', label: 'About' },
    { id: '3', href: '/contact', label: 'Contact' },
  ];

  // Example 2: Mixed valid and invalid items
  const mixedItems = [
    { id: '1', href: '/home', label: 'Home' },
    { id: '2', label: 'Missing href' }, // Invalid: no href
    { id: '3', href: '/contact', label: 'Contact' },
    { href: undefined, label: 'Undefined href' }, // Invalid: undefined href
  ];

  // Example 3: Data from API (potentially invalid)
  const apiData = [
    { url: '/api/data', title: 'API Data' }, // Wrong property names
    { href: '/valid', label: 'Valid Item' },
  ];

  return (
    <div className="space-y-6">
      {/* Basic usage with valid items */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Valid Items</h2>
        <SafeLinkMenu items={validItems} />
      </div>

      {/* With mixed valid and invalid items */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Mixed Items (with logging)</h2>
        <SafeLinkMenu
          items={mixedItems}
          onValidationError={(errors) =>
            console.log('Validation errors:', errors)
          }
        />
      </div>

      {/* With validation display */}
      <div>
        <h2 className="text-lg font-semibold mb-2">
          With Validation Display
        </h2>
        <SafeLinkMenuWithValidation
          items={mixedItems}
          showValidationErrors={true}
        />
      </div>

      {/* Custom rendering */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Custom Rendering</h2>
        <SafeLinkMenu
          items={validItems}
          renderItem={(item) => (
            <Link
              href={item.href}
              className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted"
            >
              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
              <span className="font-medium">{item.label}</span>
            </Link>
          )}
        />
      </div>

      {/* Handling empty state */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Empty State</h2>
        <SafeLinkMenu
          items={[]}
          fallbackRenderer={() => (
            <div className="p-6 text-center bg-muted rounded-lg">
              <p className="text-muted-foreground">No menu items to display</p>
            </div>
          )}
        />
      </div>
    </div>
  );
}
