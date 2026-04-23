# Wire Transfer Options - Complete Guide

## Overview

The Wire Transfer system now includes comprehensive options for all wire transfer needs, working smoothly together in real-time with proper verification and tracking.

## Available Wire Options

### 1. Domestic Transfers

#### Domestic Wire - Standard
- **Description**: Standard domestic wire transfer
- **Processing Time**: 1-3 business days
- **Fee**: $30
- **Max Amount**: $250,000
- **Daily Limit**: $500,000
- **Verification**: Required (OTP, COT, Tax)

#### Domestic Wire - Priority
- **Description**: Priority domestic wire (same day processing)
- **Processing Time**: Same day (by 5 PM EST)
- **Fee**: $50
- **Max Amount**: $100,000
- **Daily Limit**: $250,000
- **Verification**: Required (OTP, COT, Tax)

### 2. International Transfers

#### International Wire - Standard
- **Description**: Standard international wire transfer
- **Processing Time**: 3-5 business days
- **Fee**: $45
- **Max Amount**: $100,000
- **Daily Limit**: $200,000
- **Verification**: Required (OTP, COT, Tax)

#### International Wire - Priority
- **Description**: Priority international wire (faster delivery)
- **Processing Time**: 1-2 business days
- **Fee**: $75
- **Max Amount**: $50,000
- **Daily Limit**: $100,000
- **Verification**: Required (OTP, COT, Tax)

### 3. Special Options

#### Urgent Wire Transfer
- **Description**: Ultra-fast wire transfer (within 4 hours)
- **Processing Time**: Within 4 hours
- **Fee**: $150
- **Max Amount**: $25,000
- **Daily Limit**: $50,000
- **Verification**: Required (OTP, COT, Tax)

#### Future-Dated Wire
- **Description**: Schedule wire transfer for a future date
- **Processing Time**: Scheduled date
- **Fee**: $30
- **Max Amount**: $250,000
- **Daily Limit**: $500,000
- **Verification**: Not required (setup only)

#### Recurring Wire Transfer
- **Description**: Set up automatic wire transfers on a schedule
- **Processing Time**: Per schedule
- **Fee**: $25 per transfer
- **Max Amount**: $100,000 per transfer
- **Daily Limit**: $300,000
- **Verification**: Not required (initial setup)

#### Wire to Own Account
- **Description**: Transfer between your own accounts at other banks
- **Processing Time**: 1-2 business days
- **Fee**: $20
- **Max Amount**: $500,000
- **Daily Limit**: $1,000,000
- **Verification**: Not required

## Real-Time Features

### Live Option Selector
The wire options selector provides:
- Real-time fee calculations
- Estimated delivery dates
- Availability filtering based on amount
- Recommended options based on speed preference
- Category-based organization

### Real-Time Tracker
Once a wire transfer is initiated, the tracker shows:
- Live status updates
- Progress bar with percentage
- Real-time status messages
- Estimated delivery countdown
- Live status indicator (connected/offline)

### Verification Flow
The system performs verification in real-time:
1. **OTP Verification** - One-time password validation
2. **COT Verification** - Cost of transfer verification
3. **Tax Verification** - Tax clearance certification

## Integration with Wire Drawer

### Step-by-Step Flow

1. **Details Step** - Enter recipient information
2. **Options Step** - Select wire transfer option
3. **Review Step** - Verify all details
4. **Verification Steps** - OTP → COT → Tax
5. **Processing Step** - Real-time processing updates
6. **Complete Step** - Receipt and confirmation

### Using Wire Options

```typescript
import { WireOptionsSelector } from '@/components/wire-options-selector'

// In your wire transfer form
<WireOptionsSelector
  amount={5000}
  onSelectOption={(optionId) => setSelectedWireOption(optionId)}
  selectedOption={selectedOption}
  wiretype="domestic"
  showRecommendations={true}
/>
```

### Real-Time Tracking

```typescript
import { WireTransferTracker } from '@/components/wire-transfer-tracker'

// Track active transfers
<WireTransferTracker
  wireTransfer={wireTransfer}
  showRealTimeUpdates={true}
/>
```

## Service API

### WireOptionsService

```typescript
import { wireOptionsService } from '@/lib/wire-options-service'

// Get all available options
const options = wireOptionsService.getOptions()

// Get specific option
const option = wireOptionsService.getOption('domestic-standard')

// Check availability
const isAvailable = wireOptionsService.isOptionAvailable('domestic-standard', 5000)

// Get fee
const fee = wireOptionsService.getFee('domestic-standard')

// Get recommended option
const recommended = wireOptionsService.getRecommendedOption(5000, 'fast')

// Calculate total cost
const total = wireOptionsService.calculateTotalCost('domestic-standard', 5000)

// Validate wire transfer
const validation = wireOptionsService.validateWireTransfer('domestic-standard', 5000, 'US')

// Get estimated delivery date
const delivery = wireOptionsService.getEstimatedDeliveryDate('domestic-standard')

// Get real-time status
const status = await wireOptionsService.getWireStatus('WIRE123')
```

## Best Practices

### For Speed
- Use **Priority options** for faster processing (same day/1-2 days)
- Use **Urgent** for time-critical transfers
- Use **Standard** for routine transfers

### For Cost
- **Recurring Wire** has lowest per-transfer fee ($25)
- **Wire to Own Account** is most economical ($20)
- Plan future transfers to avoid urgent fees

### For Security
- All high-value transfers require verification
- Future-dated wires don't require immediate verification
- Own account transfers skip verification

### For International
- Always include recipient country for validation
- Priority international (1-2 days) at $75 is typically worth it
- Standard international takes 3-5 days

## Real-Time Functionality

### Auto-Updating Status
The system provides live updates:
- Progress updates every 2 seconds
- Status messages every 3 seconds
- Auto-reconnect if connection drops
- Live indicator shows connection status

### Estimated Delivery
Automatically calculates:
- Business day delivery dates
- Skips weekends automatically
- Shows remaining time countdown
- Updates in real-time

### Fee Calculations
Fees update instantly based on:
- Selected wire option
- Transfer amount
- Wire type (domestic/international)
- Special options applied

## Error Handling

### Amount Validation
- Checks against min/max limits
- Validates daily limits
- Shows available balance

### Option Availability
- Filters options by amount
- Shows which options are unavailable and why
- Recommends alternative options

### Verification Handling
- Retries with attempt counter
- Clear error messages
- Resend options for OTP/COT/Tax

## Monitoring Transfers

### Real-Time Dashboard
View all active transfers with:
- Current status
- Live progress percentage
- Time elapsed
- Estimated delivery
- Amount and fee details

### Status Updates
Automatic notifications for:
- Transfer initiated
- Verification complete
- Processing started
- Transfer completed
- Any errors or delays

## Future Enhancements

The system is designed to support:
- Multi-currency transfers
- Batch wire transfers
- Mobile push notifications
- SMS alerts
- Email confirmations
- API webhooks for status updates

## Support

For questions about wire options:
- Visit the help center
- Contact customer service: 1-800-935-9935
- Email: support@chase.com
- Chat with Virtual Assistant
