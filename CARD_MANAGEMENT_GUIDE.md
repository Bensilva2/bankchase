# Card Management System Guide

## Overview
The card management system provides comprehensive credit and debit card management for BankChase banking application.

## Features Implemented

### Card Display
- Grid view of all user cards
- Beautiful gradient card design
- Lock status indicator
- Balance display
- Card expiry information

### Card Actions
- **View Details** - Click any card to see full details
- **Lock/Unlock** - Freeze card to prevent transactions
- **Show/Hide Numbers** - Toggle card number visibility
- **Settings** - Access card configuration options
- **Add Card** - Add new cards to account

### Card Information
- Card name
- Last 4 digits (masked)
- Expiry date
- Current balance
- Credit limit
- Minimum payment due
- Rewards points balance

## Data Structure

```typescript
type CreditCard = {
  id: string
  name: string
  lastFour: string
  expiryDate: string
  balance: number
  creditLimit: number
  minimumPayment: number
  dueDate: string
  rewards: number
  locked: boolean
  internationalEnabled: boolean
  contactlessEnabled: boolean
  spendingLimit: number
}
```

## API Endpoints

### Get Cards
```bash
GET /api/cards?userId=USER_ID
```
Returns list of all cards for a user.

### Card Operations
```bash
POST /api/cards
{
  "action": "freeze|cancel|update_controls|set_pin|authorize|replace",
  "cardId": "string",
  ...additionalData
}
```

## Components

### CardsPage (`/app/cards/page.tsx`)
Main card management interface with:
- Card grid display
- Card detail modal
- Action buttons
- Responsive layout

### CardOptions (`/lib/card-options.ts`)
Utilities and constants for:
- Card types
- Card brands
- Card designs
- Spending limits
- Card statuses
- Utility functions for formatting and status

## Usage Examples

### Display Cards
```typescript
import { useBanking } from '@/lib/banking-context'

function MyCards() {
  const { creditCards } = useBanking()
  return (
    <div>
      {creditCards.map(card => (
        <CardItem key={card.id} card={card} />
      ))}
    </div>
  )
}
```

### Toggle Card Lock
```typescript
import { useBanking } from '@/lib/banking-context'

function LockCard() {
  const { toggleCardLock } = useBanking()
  
  return (
    <button onClick={() => toggleCardLock('card1')}>
      Lock Card
    </button>
  )
}
```

### Format Card Information
```typescript
import { 
  formatCardNumber, 
  getCreditUtilization,
  getCardStatusColor 
} from '@/lib/card-options'

const formatted = formatCardNumber('1234')  // •••• •••• •••• 1234
const utilization = getCreditUtilization(2500, 10000)  // 25%
const color = getCardStatusColor('active')  // bg-green-100 text-green-700
```

## Card Options Available

### Card Types
- Debit Card
- Credit Card
- Prepaid Card
- Business Card

### Card Brands
- Visa
- Mastercard
- American Express
- Discover

### Card Designs
- Classic
- Premium
- Metal
- Custom

### Card Features
- Contactless Payments
- International Use
- Online Shopping
- ATM Withdrawals
- Rewards Program
- Cash Back

### Spending Limits
- $500
- $1,000
- $2,500
- $5,000
- $10,000
- $25,000

### Card Statuses
- Active (Green)
- Locked (Yellow)
- Frozen (Red)
- Expired (Gray)
- Pending (Blue)

## Status Flow

```
Pending → Active → Locked/Frozen → Cancelled
                    ↓
                   Unlocked → Active
                   
Damaged/Lost → Replacement Card Issued
```

## Features Working Properly

✅ All card display options
✅ Lock/unlock functionality
✅ Show/hide card numbers
✅ Card detail view
✅ Balance and limit display
✅ Rewards point tracking
✅ Status indicators
✅ Responsive design
✅ Navigation between pages
✅ Card filtering (by status)

## Testing

### Test Card Display
1. Navigate to `/cards`
2. View all cards in grid
3. Verify card information displays correctly
4. Check balance and limit calculations

### Test Card Actions
1. Click any card for details
2. Toggle lock button
3. Show/hide card number
4. Navigate to settings
5. Return to list

### Test Responsiveness
1. Desktop: 3 columns
2. Tablet: 2 columns
3. Mobile: 1 column

## Future Enhancements

- Card issuance workflow
- Virtual card creation
- Card PIN management
- Transaction history per card
- Spending analytics
- Card replacement process
- Advanced security settings
- Multi-user access

## Troubleshooting

### Cards Not Showing
- Check if user is authenticated
- Verify banking context provider is loaded
- Check browser console for errors

### Lock/Unlock Not Working
- Ensure toggleCardLock function is available
- Check card ID is correct
- Verify state update is occurring

### Navigation Issues
- Check routing is configured correctly
- Verify Next.js navigation is working
- Check browser history is enabled

## Performance

- Lazy loading not needed (small dataset)
- Memoization applied to card components
- Efficient state updates with useCallback
- No unnecessary re-renders

## Security

- Card numbers masked by default
- Only last 4 digits visible
- PIN and CVV never stored in frontend
- Lock functionality prevents transactions
- Session-based card access control
