# Navigation System Documentation

## Overview

The navigation system has been completely redesigned to provide proper back/return navigation without redirecting to the home page. Users will now be taken back to their actual previous page.

## Key Components

### 1. Navigation History Hook (`hooks/use-navigation-history.ts`)

Tracks navigation history in sessionStorage and provides methods for navigation.

**Usage:**
```typescript
import { useNavigationHistory } from '@/hooks/use-navigation-history'

export function MyComponent() {
  const { goBack, goHome, getHistory, clearHistory } = useNavigationHistory()

  return (
    <button onClick={goBack}>
      Go Back to Previous Page
    </button>
  )
}
```

**API:**
- `goBack()` - Navigate to previous page
- `goHome()` - Navigate to dashboard
- `getHistory()` - Get full navigation history
- `clearHistory()` - Clear history (for logout/debugging)
- `currentPath` - Current page path

### 2. Navigation Provider (`app/navigation-provider.tsx`)

Provider component that automatically tracks all navigation globally. Integrated at the top level of the app.

**How it works:**
- Listens to pathname changes
- Automatically tracks each page visit
- Maintains sessionStorage history
- No manual tracking needed in components

### 3. Back Button Component (`components/back-button.tsx`)

Updated to use the proper navigation history instead of browser history.

**Usage:**
```typescript
import { BackButton } from '@/components/back-button'

export function MyPage() {
  return (
    <div>
      <BackButton showLabel={true} />
      {/* Page content */}
    </div>
  )
}
```

**Props:**
- `className?` - Custom CSS classes
- `showLabel?` - Show "Back" text next to icon
- `onBack?` - Custom callback before navigation

### 4. Navigation Utilities (`lib/navigation-utils.ts`)

Helper functions and hooks for common navigation patterns.

**Usage:**
```typescript
import { useAppNavigation } from '@/lib/navigation-utils'

export function MyComponent() {
  const {
    navigateTo,
    navigateToDashboard,
    navigateToProfile,
    navigateToSettings,
    navigateToCards,
    navigateToTransactions,
    navigateToSendMoney,
    navigateToAccount,
    navigateToBills,
    navigateToSavings,
    navigateToRewards,
    currentPath
  } = useAppNavigation()

  return (
    <>
      <button onClick={navigateToDashboard}>Go to Dashboard</button>
      <button onClick={() => navigateTo('/custom-path')}>Go to Custom</button>
    </>
  )
}
```

## How It Works

### Navigation History Tracking

1. **Initial Load**: Navigation history initialized from sessionStorage
2. **Page Change**: When pathname changes, new page is added to history
3. **Back Navigation**: Previous page path is retrieved and user navigated there
4. **Fallback**: If no history, defaults to `/dashboard`

### History Storage

Navigation history stored in `sessionStorage` with structure:
```typescript
interface NavigationHistory {
  path: string
  timestamp: number
}

// Example storage:
[
  { path: '/dashboard', timestamp: 1700000000000 },
  { path: '/cards', timestamp: 1700000005000 },
  { path: '/send-money', timestamp: 1700000010000 }
]
```

### Session Scope

- History is stored per session
- Cleared when user closes browser/tab
- Survives page refreshes within same session
- Max 50 entries maintained

## Implementation Details

### Back Button Flow

```
User clicks back button
  ↓
BackButton component calls goBack()
  ↓
useNavigationHistory gets previous path from history
  ↓
router.push(previousPath) navigates to that page
  ↓
NavigationProvider tracks new page
  ↓
History updated in sessionStorage
```

### Why Not `router.back()`?

The browser's `router.back()` method uses browser history which can:
- Get corrupted by server-side redirects
- Redirect to login/error pages unexpectedly
- Go to external sites
- Jump multiple pages back

Our approach uses explicit path tracking to ensure navigation goes exactly where expected.

## Common Scenarios

### Scenario 1: User navigates through multiple pages

```
Dashboard → Send Money → Confirm Transfer → Back Button
                                              ↓
                            User returns to Confirm Transfer (correct!)
```

### Scenario 2: New session or no history

```
User opens /cards directly (no history)
                            ↓
                      User clicks back
                            ↓
                    No previous page found
                            ↓
                   Falls back to /dashboard
```

### Scenario 3: Multiple windows/tabs

```
Tab 1: /dashboard → /cards
Tab 2: /settings → /profile
                     ↓
Each tab has independent history in sessionStorage
No interference between tabs
```

## Debugging

### Check Navigation History

```typescript
const history = getNavigationHistory()
console.log('Navigation history:', history)
```

### Clear History

```typescript
import { clearNavigationHistory } from '@/lib/navigation-utils'
clearNavigationHistory()
```

### Get Previous Page

```typescript
import { getPreviousPage } from '@/lib/navigation-utils'
const previous = getPreviousPage()
console.log('Previous page was:', previous)
```

## Migration Guide

### If you have custom back buttons

**Before:**
```typescript
const router = useRouter()
const handleBack = () => router.back()
```

**After:**
```typescript
const { goBack } = useNavigationHistory()
const handleBack = () => goBack()
```

### If you're using `router.push()`

No changes needed. Navigation system automatically tracks all path changes.

### If you're redirecting to home page

Use the new navigation system instead:
```typescript
// Old way (might cause history issues):
router.push('/')

// New way (proper history tracking):
const { navigateToDashboard } = useAppNavigation()
navigateToDashboard()
```

## Best Practices

1. **Use BackButton component** for consistency
2. **Use navigation utilities** instead of direct router.push()
3. **Don't clear history** except on logout/session end
4. **Test back navigation** across multiple pages
5. **Fallback to dashboard** for edge cases

## Troubleshooting

### Back button not working

1. Check if NavigationProvider is in layout
2. Verify sessionStorage is enabled
3. Check browser console for errors
4. Clear sessionStorage and reload

### Going to wrong page

1. Check navigation history: `getNavigationHistory()`
2. Verify previous path is correct
3. Check for manual `router.push()` calls overriding history
4. Look for redirect logic in middleware

### History getting too large

- Max 50 entries maintained automatically
- Old entries removed as new ones added
- Not a concern in normal usage

## Performance

- Minimal overhead (sessionStorage access is fast)
- No external API calls
- No additional network requests
- Scales to any number of pages
- No memory leaks (history cleared on session end)

## Browser Support

Works on all modern browsers supporting:
- `sessionStorage` (all modern browsers)
- `useRouter` and `usePathname` from next/navigation
- ES6+ features

Gracefully degrades if sessionStorage unavailable.

## Summary

The new navigation system provides:
✓ Accurate back navigation to previous pages
✓ No automatic redirects to home page
✓ Proper history tracking throughout app
✓ Fallback mechanisms for edge cases
✓ Type-safe API for developers
✓ Zero configuration needed (automatic)
✓ Session-based history management
✓ Simple debugging tools
