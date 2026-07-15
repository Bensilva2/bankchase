# Navigation System - Quick Reference

## Problem Solved

**Before:** Back button would go to home page  
**After:** Back button goes to actual previous page

## Quick Usage

### Using Back Button (Recommended)

```typescript
import { BackButton } from '@/components/back-button'

export default function MyPage() {
  return (
    <div>
      <BackButton showLabel={true} />
      {/* Page content */}
    </div>
  )
}
```

### Using Hook in Component

```typescript
import { useNavigationHistory } from '@/hooks/use-navigation-history'

export default function MyComponent() {
  const { goBack, navigateToDashboard } = useNavigationHistory()

  return (
    <>
      <button onClick={goBack}>← Back</button>
      <button onClick={navigateToDashboard}>Home</button>
    </>
  )
}
```

### Using Navigation Utils

```typescript
import { useAppNavigation } from '@/lib/navigation-utils'

export default function MyPage() {
  const { navigateTo, navigateToDashboard, currentPath } = useAppNavigation()

  return (
    <button onClick={() => navigateTo('/cards')}>
      Go to Cards
    </button>
  )
}
```

## How It Works

1. **Every page visit is tracked** in sessionStorage
2. **Back button reads history** and navigates to previous page
3. **No home page redirect** - goes exactly where user came from
4. **Fallback to dashboard** if no history exists

## Key Files

- `hooks/use-navigation-history.ts` - Main hook for navigation
- `app/navigation-provider.tsx` - Automatic tracking provider
- `components/back-button.tsx` - Updated back button
- `lib/navigation-utils.ts` - Navigation utilities
- `NAVIGATION_SYSTEM.md` - Full documentation

## API Reference

### useNavigationHistory()

```typescript
const {
  goBack,           // () => void - Navigate to previous page
  goHome,           // () => void - Navigate to /dashboard
  getHistory,       // () => Array - Get navigation history
  clearHistory,     // () => void - Clear history
  currentPath       // string - Current page path
} = useNavigationHistory()
```

### useAppNavigation()

```typescript
const {
  navigateTo,              // (path: string) => void
  navigateToDashboard,     // () => void
  navigateToProfile,       // () => void
  navigateToSettings,      // () => void
  navigateToCards,         // () => void
  navigateToTransactions,  // () => void
  navigateToSendMoney,     // () => void
  navigateToAccount,       // () => void
  navigateToBills,         // () => void
  navigateToSavings,       // () => void
  navigateToRewards,       // () => void
  currentPath              // string - Current page path
} = useAppNavigation()
```

### Utility Functions

```typescript
import {
  getNavigationHistory,      // () => Array<{path, timestamp}>
  clearNavigationHistory,    // () => void
  getPreviousPage,          // () => string | null
  navigateToPreviousPage    // (fallback?: string) => void
} from '@/lib/navigation-utils'
```

## Common Patterns

### Pattern 1: Simple Back Navigation

```typescript
<BackButton showLabel />
```

### Pattern 2: Custom Back Handler

```typescript
<BackButton
  onBack={() => {
    console.log('Going back!')
    // Custom logic here
  }}
/>
```

### Pattern 3: Navigate to Specific Page

```typescript
const { navigateTo } = useAppNavigation()

<button onClick={() => navigateTo('/send-money')}>
  Send Money
</button>
```

### Pattern 4: Navigate Home on Error

```typescript
const { navigateToDashboard } = useNavigationHistory()

try {
  // Some operation
} catch (error) {
  console.error(error)
  navigateToDashboard() // Go home on error
}
```

## Features

✓ Tracks all page visits automatically  
✓ No manual history management needed  
✓ Persistent within session  
✓ Works across all pages  
✓ Fallback to dashboard if needed  
✓ Type-safe API  
✓ Zero configuration  
✓ No performance impact  

## What Changed

| Aspect | Before | After |
|--------|--------|-------|
| Back Button | `router.back()` | Navigation history |
| Destination | Unpredictable | Actual previous page |
| Home Redirects | Frequent | Only when needed |
| History | Browser history | Session storage |
| Tracking | Automatic | Automatic |
| API | None | Full utilities |

## Testing

### Test Back Navigation

```typescript
// Navigate through pages
/dashboard → /cards → /send-money

// Click back button
// ✓ Should go to /cards (not /dashboard)

// Click back again
// ✓ Should go to /dashboard
```

### Test Fallback

```typescript
// Open /cards directly (no history)
// Click back button
// ✓ Should go to /dashboard (fallback)
```

## That's It!

Navigation system is automatic and ready to use. Just use the components and hooks as shown above.

For detailed information, see `NAVIGATION_SYSTEM.md`.
