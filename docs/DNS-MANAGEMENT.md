# DNS Management Dashboard

A professional DNS record management interface for the BankChase application powered by Cloudflare.

## Overview

The DNS Management Dashboard provides a complete UI for managing Cloudflare DNS records directly from your application. It includes:

- Zone selection and automatic record fetching
- DNS record listing with color-coded types (A, AAAA, CNAME, MX, TXT, NS, SOA)
- Create new DNS records with validation
- Edit existing records in-place
- Delete records with confirmation
- Copy record values to clipboard
- Real-time loading and error states
- TTL management
- Proxy status toggling (for Cloudflare proxied records)

## File Structure

```
app/admin/dns/
├── page.tsx                      # Main DNS management page

components/
├── dns-records-table.tsx         # DNS records table display
└── dns-record-drawer.tsx         # Form drawer for create/edit
```

## Components

### DNS Management Page (`app/admin/dns/page.tsx`)

The main page component that orchestrates the DNS management experience.

**Features:**
- Zone selection dropdown
- Add New Record button
- Records table with inline actions
- Auto-refresh on zone change
- Error and loading state handling

**State Management:**
- Uses `useDNS()` hook from `lib/hooks/use-cloudflare.ts`
- Manages drawer open/close state
- Tracks editing record selection

**Usage:**
```tsx
// Access at /admin/dns when authenticated
// Requires authentication (Clerk)
// Requires CLOUDFLARE_API_TOKEN environment variable
```

### DNS Records Table (`components/dns-records-table.tsx`)

A data table displaying all DNS records for the selected zone.

**Features:**
- Responsive table layout
- Color-coded record type badges
- Edit button for each record
- Delete button with confirmation
- Copy-to-clipboard functionality with visual feedback
- TTL display
- Proxy status indicator
- Empty state messaging

**Props:**
```tsx
interface DNSRecordsTableProps {
  records: DNSRecord[]
  onEdit: (record: DNSRecord) => void
  onDelete: (recordId: string) => void
}

interface DNSRecord {
  id: string
  type: string
  name: string
  content: string
  ttl: number
  proxied?: boolean
}
```

### DNS Record Drawer (`components/dns-record-drawer.tsx`)

A drawer/modal component for creating or editing DNS records.

**Features:**
- Form validation for all fields
- Record type selection (A, AAAA, CNAME, MX, TXT, NS, SOA)
- Dynamic field validation based on record type
- TTL input with reasonable defaults
- Proxy toggle for supported record types
- Save and Cancel buttons
- Loading state during submission
- Error message display

**Props:**
```tsx
interface DNSRecordDrawerProps {
  isOpen: boolean
  isEditing: boolean
  record?: DNSRecord
  onClose: () => void
  onSave: (recordData: CreateRecordData) => Promise<void>
  loading?: boolean
}

interface CreateRecordData {
  type: string
  name: string
  content: string
  ttl: number
  proxied?: boolean
}
```

## Usage Example

### Accessing the Dashboard

1. Navigate to `/admin/dns` (requires authentication)
2. Select a zone from the dropdown
3. Records for that zone automatically load

### Creating a Record

1. Click "Add New Record" button
2. Fill in the form:
   - **Type**: Select record type (A, AAAA, CNAME, etc.)
   - **Name**: Record name (e.g., `www`, `mail`, `api`)
   - **Content**: Record value (IP, hostname, etc.)
   - **TTL**: Time to live (300-2147483647 seconds, default 3600)
   - **Proxy**: Toggle Cloudflare proxy (if applicable)
3. Click Save
4. Record appears in table immediately

### Editing a Record

1. Click the edit icon on any record
2. Form drawer opens with current values
3. Modify any field
4. Click Save to update

### Deleting a Record

1. Click the delete icon on any record
2. Confirm the deletion
3. Record removed from table

### Copying Record Values

1. Hover over record content
2. Click the copy icon
3. Value copied to clipboard (visual feedback for 2 seconds)

## Integration with Cloudflare API

The DNS management uses the Cloudflare API via:

- **Endpoint**: `/api/cloudflare/dns`
- **Methods**: GET (list), POST (create), PUT (update), DELETE (remove)
- **Authentication**: Uses `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`

### API Examples

```bash
# Get zones
GET /api/cloudflare/dns?action=zones

# List records in zone
GET /api/cloudflare/dns?zoneId=abc123

# Create record
POST /api/cloudflare/dns
{
  "zoneId": "abc123",
  "type": "A",
  "name": "www",
  "content": "192.0.2.1",
  "ttl": 3600,
  "proxied": false
}

# Update record
PUT /api/cloudflare/dns
{
  "zoneId": "abc123",
  "recordId": "rec123",
  "type": "A",
  "name": "www",
  "content": "192.0.2.2",
  "ttl": 3600,
  "proxied": false
}

# Delete record
DELETE /api/cloudflare/dns
{
  "zoneId": "abc123",
  "recordId": "rec123"
}
```

## Using the React Hook

Import and use the `useDNS()` hook in any component:

```tsx
import { useDNS } from '@/lib/hooks/use-cloudflare'

export function MyComponent() {
  const {
    zones,           // Array of Cloudflare zones
    records,         // Current zone's DNS records
    loading,         // Loading state
    error,           // Error message if any
    fetchZones,      // Fetch all zones
    fetchRecords,    // Fetch records for a zone
    createRecord,    // Create new record
    updateRecord,    // Update existing record
    deleteRecord,    // Delete a record
  } = useDNS()

  return (
    // Use the above in your component
  )
}
```

## Record Types

### Supported Types

- **A**: IPv4 address (e.g., `192.0.2.1`)
- **AAAA**: IPv6 address (e.g., `2001:db8::1`)
- **CNAME**: Canonical name (e.g., `www.example.com`)
- **MX**: Mail exchange (e.g., `mail.example.com`)
- **TXT**: Text record (e.g., verification codes, SPF)
- **NS**: Nameserver (e.g., `ns1.example.com`)
- **SOA**: Start of Authority (rarely edited)

### Color Coding

Each record type has a distinct color for easy visual identification:

- **A**: Blue
- **AAAA**: Purple
- **CNAME**: Green
- **MX**: Orange
- **TXT**: Pink
- **NS**: Indigo
- **SOA**: Yellow

## Styling

The DNS Management UI uses the project's design token system:

- **Colors**: Dark mode optimized with light mode support
- **Typography**: Consistent with banking application standards
- **Spacing**: Tailwind CSS spacing scale for consistency
- **Icons**: Lucide React icons for a polished look

## Security Considerations

1. **Authentication**: All DNS operations require Clerk authentication
2. **API Token**: Stored in environment variables, never exposed client-side
3. **Input Validation**: Form validation prevents invalid records
4. **Confirmation Dialogs**: Destructive actions (delete) require confirmation
5. **Error Handling**: Sensitive errors are logged but user-friendly messages shown

## Error Handling

The dashboard handles various error scenarios:

- **Missing Zone Selection**: Prompts user to select a zone
- **API Errors**: Displays error message with retry option
- **Network Issues**: Graceful degradation with retry capability
- **Validation Errors**: Form-level validation messages

## Performance

- **Lazy Loading**: Records loaded only when zone is selected
- **Efficient Updates**: Only affected records re-render on changes
- **Optimistic Updates**: UI updates before API confirmation (with rollback)
- **Request Debouncing**: Zone changes debounced to prevent rapid API calls

## Future Enhancements

- Bulk import/export DNS records
- Record templates for common configurations
- DNS propagation checker
- DNSSEC management
- Record history and changelog
- Scheduled record updates
- Batch operations (multi-record edit/delete)

## Troubleshooting

### Records not loading
- Verify zone is selected
- Check `CLOUDFLARE_API_TOKEN` is set
- Check `CLOUDFLARE_ACCOUNT_ID` is set
- Check browser console for API errors

### Cannot create/edit records
- Verify all required fields are filled
- Check record type and content format
- Verify API token has write permissions
- Check zone exists in Cloudflare account

### Proxy toggle disabled
- Not all record types support Cloudflare proxy
- Only A, AAAA, CNAME records can be proxied
- Other types will have toggle disabled

---

For more information, see the main [INTEGRATIONS.md](./INTEGRATIONS.md) documentation.
