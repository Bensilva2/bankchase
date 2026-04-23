# Chase Banking App - Payment Options QA Checklist

## 🚀 Quick Test Script
Run this sequence to verify all payment options work smoothly:

1. Navigate to "Pay & Transfer" tab
2. Click each payment option in order
3. Verify smooth loading and transitions
4. Complete one transaction from each option
5. Verify real-time balance updates

---

## 📱 Send Money with Zelle® - QA Tests

### Basic Functionality
- [ ] Click "Send money with Zelle®" button
  - [ ] Spinner appears (≤200ms)
  - [ ] Button shows loading state visually
  - [ ] No UI freezing or jank
  
- [ ] Drawer opens with contact list
  - [ ] Preloaded contacts display instantly
  - [ ] No loading delays after drawer appears
  - [ ] Contact avatars show correctly

### Search & Selection
- [ ] Search bar works smoothly
  - [ ] Typing filters contacts in real-time
  - [ ] Results update instantly
  - [ ] Clears when backspacing
  
- [ ] Contact selection
  - [ ] Clicking contact advances to amount step
  - [ ] Selected contact displays in confirmation
  - [ ] Contact info (name, email/phone) correct

### Amount Entry
- [ ] Amount validation
  - [ ] Only numbers allowed
  - [ ] Decimal entry works
  - [ ] Clear button works
  - [ ] Balance check validates correctly
  
- [ ] Sufficient funds check
  - [ ] Shows available balance
  - [ ] Prevents overspending
  - [ ] Error message appears for insufficient funds

### Confirmation & Sending
- [ ] Confirmation screen shows
  - [ ] Correct recipient name
  - [ ] Correct amount
  - [ ] Transaction type displays
  
- [ ] Send button works
  - [ ] Completes transaction
  - [ ] Shows success screen
  - [ ] Receipt generates

### Post-Transaction
- [ ] Receipt displays
  - [ ] Transaction ID shows
  - [ ] Amount and recipient correct
  - [ ] Timestamp is accurate
  
- [ ] Balance updates immediately
  - [ ] Accounts view shows new balance
  - [ ] No page refresh needed
  - [ ] History shows new transaction

---

## 🔄 Transfer Between Accounts - QA Tests

### Basic Functionality
- [ ] Click "Transfer" button
  - [ ] Spinner appears (≤200ms)
  - [ ] Button shows loading state
  - [ ] Smooth transition to drawer

- [ ] Drawer opens with account list
  - [ ] All accounts preloaded
  - [ ] No loading delays
  - [ ] Default accounts selected

### Account Selection
- [ ] From/To account dropdowns work
  - [ ] Lists all user accounts
  - [ ] Selections update instantly
  - [ ] Cannot select same account twice

- [ ] Account details display
  - [ ] Account name shows
  - [ ] Account type shows
  - [ ] Available balance displays

### Amount Entry
- [ ] Amount field validates
  - [ ] Numeric input only
  - [ ] Decimal entry works
  - [ ] Real-time balance check

- [ ] Balance validation
  - [ ] Shows available balance
  - [ ] Prevents transfer exceeding balance
  - [ ] Error appears for invalid amounts

### Confirmation
- [ ] Review screen shows all details
  - [ ] From account correct
  - [ ] To account correct
  - [ ] Amount correct
  - [ ] No fees charged

- [ ] Confirm button processes transfer
  - [ ] Transaction completes
  - [ ] Balances update immediately
  - [ ] Receipt displays

### Post-Transfer
- [ ] Both accounts update
  - [ ] Sending account decreased
  - [ ] Receiving account increased
  - [ ] No page refresh needed
  
- [ ] Transaction appears in history
  - [ ] Shows in recent activity
  - [ ] Status is "completed"
  - [ ] Amount correct

---

## 📋 Pay Bills - QA Tests

### Basic Functionality
- [ ] Click "Pay bills" button
  - [ ] Spinner appears (≤200ms)
  - [ ] Button shows loading state
  - [ ] Drawer opens smoothly

- [ ] Drawer shows payee list
  - [ ] Default payees load instantly
  - [ ] Saved payees appear
  - [ ] Payee categories organize properly

### Payee Selection
- [ ] Payee list shows
  - [ ] Categories visible
  - [ ] Search works if needed
  - [ ] Payee details display

- [ ] Selecting payee shows options
  - [ ] Account number appears
  - [ ] Last amount displays
  - [ ] Category shows

### Amount & Date Entry
- [ ] Amount validation
  - [ ] Numeric input only
  - [ ] Prevents zero or negative
  - [ ] Decimal entry works

- [ ] Payment date selection
  - [ ] Calendar/date picker works
  - [ ] Can select future dates
  - [ ] Validates dates correctly

### Frequency Options
- [ ] Frequency dropdown works
  - [ ] Options: Once, Weekly, Monthly
  - [ ] Default to "Once"
  - [ ] Changing updates UI

- [ ] Recurring payment logic
  - [ ] Shows next payment date
  - [ ] Displays frequency badge
  - [ ] Can modify before confirming

### Confirmation & Payment
- [ ] Review screen shows all details
  - [ ] Payee name correct
  - [ ] Amount correct
  - [ ] Date/Frequency correct

- [ ] Pay button processes payment
  - [ ] Payment submits
  - [ ] Shows success
  - [ ] Receipt generates

### Scheduled Payments Management
- [ ] Scheduled payments display
  - [ ] Shows in separate section
  - [ ] Lists next payment dates
  - [ ] Frequency badges show

- [ ] Cancel payment works
  - [ ] Cancel button visible for scheduled payments
  - [ ] Cancels immediately
  - [ ] Status updates in real-time
  - [ ] Removed from scheduled list

---

## 🌍 Wires & Global Transfers - QA Tests

### Basic Functionality
- [ ] Click "Wires & global" button
  - [ ] Spinner appears (≤200ms)
  - [ ] Button shows loading state
  - [ ] Drawer opens smoothly

- [ ] Form displays
  - [ ] All fields preloaded
  - [ ] Wire type selector visible
  - [ ] Account selector ready

### Wire Type Selection
- [ ] Wire type dropdown
  - [ ] Options: Domestic, International
  - [ ] Switching updates fields accordingly
  - [ ] International shows SWIFT code field

### Recipient Information
- [ ] Recipient name field
  - [ ] Text input works
  - [ ] Validates non-empty
  - [ ] No special character issues

- [ ] Bank information
  - [ ] Bank name entry works
  - [ ] Routing number: 9 digits
  - [ ] Account number: 8+ digits
  - [ ] Field validation shows errors

### Amount Entry
- [ ] Amount validation
  - [ ] Numeric only
  - [ ] Decimal entry works
  - [ ] Balance check validates

### Verification Process
- [ ] Initial verification starts
  - [ ] OTP step appears
  - [ ] Form data persists

- [ ] OTP verification
  - [ ] Code field appears (6 digits)
  - [ ] Accept button processes
  - [ ] Wrong code shows error
  - [ ] Correct code advances step

- [ ] COT verification
  - [ ] COT code required
  - [ ] Similar to OTP flow
  - [ ] Validates correctly

- [ ] TAX verification
  - [ ] TAX code required
  - [ ] Final verification step
  - [ ] Correct code processes wire

### Processing & Confirmation
- [ ] Processing screen shows
  - [ ] Progress bar displays
  - [ ] Status messages update
  - [ ] Takes ~3-5 seconds

- [ ] Success screen appears
  - [ ] Confirmation number displays
  - [ ] Transaction ID shows
  - [ ] Wire details summarize
  - [ ] Receipt option available

### Post-Wire
- [ ] Balance updates
  - [ ] Sending account decreased
  - [ ] Amount reflected immediately
  - [ ] No page refresh needed

- [ ] Transaction history updated
  - [ ] Wire appears as transaction
  - [ ] Shows with full details
  - [ ] Confirmation number links to details

---

## 🔄 Cross-Functionality Tests

### Multiple Options in Sequence
- [ ] Open Send Money
  - [ ] Close drawer
  - [ ] Open Transfer
  - [ ] Close drawer
  - [ ] Open Pay Bills
  - [ ] All open/close smoothly without errors

### Rapid Clicking
- [ ] Rapidly click payment options
  - [ ] No errors occur
  - [ ] UI doesn't freeze
  - [ ] Only one drawer opens at a time
  - [ ] Previous drawers close properly

### Real-Time Balance Sync
- [ ] After each transaction
  - [ ] Main accounts view updates
  - [ ] Transfer amounts correct
  - [ ] No manual refresh needed
  - [ ] Balances across all views consistent

### Transaction History
- [ ] All transactions appear
  - [ ] Send Money appears
  - [ ] Transfers appear
  - [ ] Scheduled payments appear
  - [ ] Wire transfers appear
  - [ ] All with correct amounts and timestamps

---

## ⚠️ Error Handling Tests

### Validation Errors
- [ ] Invalid routing number
  - [ ] Shows error message
  - [ ] Form doesn't submit
  - [ ] Data persists for correction

- [ ] Insufficient funds
  - [ ] Shows error message
  - [ ] Shows available balance
  - [ ] Can reduce amount and retry

- [ ] Empty required fields
  - [ ] Cannot submit
  - [ ] Error highlights field
  - [ ] Message explains requirement

### Network/Async Errors
- [ ] Transaction fails
  - [ ] Shows error message
  - [ ] Offers retry option
  - [ ] Form data preserved

- [ ] Verification code wrong
  - [ ] Shows error (red highlight)
  - [ ] Can retry
  - [ ] Resend option if available

---

## 📊 Performance Metrics

### Load Times
- [ ] Button click to spinner: **≤ 50ms** ✓
- [ ] Spinner to drawer open: **≤ 200ms** ✓
- [ ] Drawer content render: **≤ 300ms** ✓
- [ ] Form submission: **≤ 500ms** ✓
- [ ] Balance update: **≤ 100ms** ✓

### Animations
- [ ] Button press animation: **Smooth** ✓
- [ ] Spinner animation: **Continuous** ✓
- [ ] Drawer slide-in: **Smooth** ✓
- [ ] Content fade-in: **Smooth** ✓
- [ ] Transitions: **No jank** ✓

---

## 🎯 Accessibility Tests

- [ ] All buttons have visible focus states
- [ ] Form labels associated with inputs
- [ ] Error messages announced
- [ ] Keyboard navigation works
- [ ] Color contrast meets WCAG AA
- [ ] Drawer opens/closes properly
- [ ] No content hidden from screen readers

---

## 📲 Device Tests

### Mobile (iPhone/Android)
- [ ] Touch feedback responsive
- [ ] Drawer fills screen properly
- [ ] Keyboard doesn't cover inputs
- [ ] Amount keypad works
- [ ] All text readable
- [ ] Buttons easily tappable (48px min)

### Tablet
- [ ] Drawer width appropriate
- [ ] Touch areas sufficient
- [ ] Landscape orientation works
- [ ] All features accessible

### Desktop
- [ ] Mouse hover states work
- [ ] Keyboard shortcuts functional
- [ ] Drawer width constrained
- [ ] Large screens display well

---

## ✅ Final Verification

Before deploying, confirm:

- [ ] All 4 payment options work individually
- [ ] Switching between options is smooth
- [ ] Balances update in real-time
- [ ] Transactions appear in history immediately
- [ ] No console errors
- [ ] No performance warnings
- [ ] Mobile responsiveness verified
- [ ] Accessibility tested
- [ ] Error handling works
- [ ] Verification codes validate

---

## 🚀 Sign-Off

Date Tested: ________________
Tester Name: ________________
All Tests Pass: ☐ Yes ☐ No

Issues Found:
- [ ] None
- [ ] Minor (cosmetic)
- [ ] Major (blocking)
- [ ] Critical (security/data)

Notes: ___________________________________________________________

