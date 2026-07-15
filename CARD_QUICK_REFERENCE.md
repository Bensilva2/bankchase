# Card Management - Quick Reference

## Access Card Management
Navigate to `/cards` to access the card management interface.

## Main Features

### View Cards
- All cards displayed in grid layout
- Shows card name, last 4 digits, expiry date, and balance
- Click any card to see full details

### Card Details View
Shows when you click a card:
- Full card display with gradient design
- Balance and credit limit
- Minimum payment and due date
- Rewards points balance
- Credit utilization bar

### Card Actions
Within card details, you can:
- **Show/Hide Number** - Toggle card number visibility
- **Lock/Unlock** - Freeze card to prevent transactions
- **Settings** - Navigate to card configuration
- **Close** - Return to card list

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

### Spending Limits
- $500, $1,000, $2,500
- $5,000, $10,000, $25,000

### Card Features
- Contactless Payments
- International Use
- Online Shopping
- ATM Withdrawals
- Rewards Program
- Cash Back

## Common Tasks

### Lock a Card
1. Navigate to `/cards`
2. Click a card to view details
3. Click "Lock Card" button
4. Button changes to "Unlock Card"

### Show Card Number
1. Open card details
2. Click "Show Card Number"
3. Full card number appears
4. Click "Hide Card Number" to mask again

### View Card Balance
1. Open card details
2. Look at the information grid
3. Balance shown with credit utilization percentage

### Add New Card
1. Click "Add Card" button (top right)
2. Navigates to card add form
3. Fill in card details

## Using Components in Code

### Display a Card
```typescript
import { CardDisplay } from '@/components/card-management/card-display'

<CardDisplay 
  card={creditCard} 
  compact 
  onClick={() => setSelected(creditCard)} 
/>
```

### Show Card Info Grid
```typescript
import { CardInfoGrid } from '@/components/card-management/card-display'

<CardInfoGrid card={creditCard} />
```

### Add Card Actions
```typescript
import { CardActions } from '@/components/card-management/card-actions'

<CardActions
  card={creditCard}
  showCardNumber={show}
  onToggleShow={() => setShow(!show)}
  onToggleLock={() => toggleLock(creditCard.id)}
  onSettings={() => navigate(`/cards/${creditCard.id}/settings`)}
/>
```

## Helper Functions

### Format Card Number
```typescript
import { formatCardNumber } from '@/lib/card-options'

const display = formatCardNumber('1234')  
// Returns: •••• •••• •••• 1234
```

### Get Utilization
```typescript
import { getCreditUtilization, getUtilizationColor } from '@/lib/card-options'

const usage = getCreditUtilization(2500, 10000)  // 25%
const color = getUtilizationColor(usage)  // 'text-green-600'
```

### Get Status Color
```typescript
import { getCardStatusColor } from '@/lib/card-options'

const statusClass = getCardStatusColor('active')
// Returns: 'bg-green-100 text-green-700'
```

## Card Information Structure

```typescript
{
  id: "card1",
  name: "Chase Sapphire Reserve",
  lastFour: "8901",
  expiryDate: "08/27",
  balance: 3247.56,
  creditLimit: 25000,
  minimumPayment: 125.0,
  dueDate: "2024-12-25",
  rewards: 45000,
  locked: false,
  internationalEnabled: true,
  contactlessEnabled: true,
  spendingLimit: 5000
}
```

## Troubleshooting

### Cards Not Displaying
- Check user is logged in
- Verify banking context is loaded
- Check browser console for errors

### Lock Toggle Not Working
- Ensure card has valid ID
- Check toggleCardLock function is available
- Verify state is updating

### Navigation Issues
- Confirm Next.js routing is set up
- Check browser history is enabled
- Try refreshing the page

## Keyboard Shortcuts
- `Esc` - Close card detail view
- `Enter` - Confirm actions

## Responsive Design
- **Desktop** - 3 card columns
- **Tablet** - 2 card columns
- **Mobile** - 1 card column

## Performance
- Cards load instantly
- No delay on interactions
- Smooth animations and transitions
- Efficient re-renders

## Security
- Card numbers masked by default
- Only last 4 digits visible
- PIN/CVV never shown
- Lock prevents transactions
- Session-based access

## Notes
- Changes sync automatically to context
- All operations are optimistic UI
- No page reload needed
- Data persists in session

## For Developers
- See `CARD_MANAGEMENT_GUIDE.md` for complete documentation
- See `lib/card-options.ts` for all available options
- See `components/card-management/*.tsx` for component implementation
