# AgentMail Integration Guide

This document describes the AgentMail email integration for the BankChase AI Suite application.

## Overview

The application uses AgentMail for reliable, programmatic email management. AgentMail provides:

- **Email Sending**: Send transactional and custom emails
- **Email Receiving**: Receive and manage emails in virtual inboxes
- **API-First Design**: Complete REST API for email operations
- **No SMTP Setup**: No need to configure SMTP servers

## Setup

### 1. Environment Variables

Add your AgentMail API key to your environment variables:

```bash
AGENTMAIL_API_KEY=am_us_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Get your API key from the [AgentMail Console](https://console.agentmail.to).

### 2. Features

#### Email Sending

Three types of emails can be sent:

1. **Onboarding Email**: Welcome email for new users
2. **Completion Email**: Workflow completion notification
3. **Custom Email**: Any custom email with HTML, text, CC, BCC, and reply-to support

#### Email Receiving

- Create virtual inboxes to receive emails
- List and retrieve email messages
- Extract email content (with automatic text/HTML parsing)
- Support for pagination

## API Endpoints

### Send Email

**POST** `/api/email/send`

```json
{
  "type": "custom",
  "email": "user@example.com",
  "name": "John Doe",
  "subject": "Your Subject",
  "html": "<p>Your HTML content</p>",
  "text": "Your plain text content",
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"],
  "replyTo": "reply@example.com"
}
```

**Supported Types**:
- `onboarding` - Onboarding welcome email
- `completion` - Workflow completion email (requires `workflowRunId`)
- `custom` - Custom email (requires `subject`)

**Response**:
```json
{
  "success": true,
  "messageId": "msg_xxxxx"
}
```

### List Messages

**GET** `/api/email/inbox?inboxId=YOUR_INBOX_ID&action=list-messages&limit=10`

Returns a list of messages in the specified inbox.

**Query Parameters**:
- `inboxId` (required): The inbox ID
- `action` (required): "list-messages"
- `limit` (optional): Number of messages to retrieve (default: 10)
- `pageToken` (optional): For pagination

**Response**:
```json
{
  "success": true,
  "messages": [
    {
      "id": "msg_xxxxx",
      "subject": "Email Subject",
      "from": "sender@example.com",
      "to": "recipient@example.com",
      "created_at": "2024-01-15T10:30:00Z",
      "extracted_text": "Email text content",
      "extracted_html": "<p>Email HTML content</p>"
    }
  ],
  "pageToken": "next_page_token",
  "total": 50
}
```

### Get Message

**GET** `/api/email/inbox?inboxId=YOUR_INBOX_ID&action=get-message&messageId=MESSAGE_ID`

Retrieve a specific message with full content.

**Query Parameters**:
- `inboxId` (required): The inbox ID
- `action` (required): "get-message"
- `messageId` (required): The message ID

**Response**:
```json
{
  "success": true,
  "message": {
    "id": "msg_xxxxx",
    "subject": "Email Subject",
    "from": "sender@example.com",
    "to": "recipient@example.com",
    "created_at": "2024-01-15T10:30:00Z",
    "text": "Full text content",
    "html": "<p>Full HTML content</p>",
    "extracted_text": "Parsed text content",
    "extracted_html": "<p>Parsed HTML content</p>"
  }
}
```

## Client-Side Usage

### Using the `useEmail` Hook

```typescript
import { useEmail } from '@/lib/hooks/useEmail'

function MyComponent() {
  const { sendEmail, loading, error } = useEmail()

  const handleSendEmail = async () => {
    const result = await sendEmail({
      type: 'custom',
      email: 'user@example.com',
      name: 'John Doe',
      subject: 'Hello!',
      html: '<p>Welcome to our service</p>',
      text: 'Welcome to our service',
    })

    if (result.success) {
      console.log('Email sent:', result.messageId)
    } else {
      console.error('Failed to send email:', result.error)
    }
  }

  return (
    <button onClick={handleSendEmail} disabled={loading}>
      {loading ? 'Sending...' : 'Send Email'}
    </button>
  )
}
```

### Using the Email Composer Component

```typescript
import { EmailComposer } from '@/components/email-composer'

export default function MyPage() {
  return (
    <EmailComposer
      recipientEmail="user@example.com"
      recipientName="John Doe"
      onSuccess={() => console.log('Email sent!')}
    />
  )
}
```

### Using the Inbox Viewer Component

```typescript
import { EmailInboxViewer } from '@/components/email-inbox-viewer'

export default function MyPage() {
  return (
    <EmailInboxViewer
      inboxId="your-inbox-id"
      limit={20}
    />
  )
}
```

## Server-Side Usage

### Using the Email Client

```typescript
import { sendOnboardingEmail, sendCustomEmail } from '@/lib/email/agentmail-client'

// Send onboarding email
const result = await sendOnboardingEmail({
  email: 'user@example.com',
  name: 'John Doe',
})

// Send custom email
const result = await sendCustomEmail({
  to: 'user@example.com',
  subject: 'Hello',
  html: '<p>Welcome!</p>',
  text: 'Welcome!',
})
```

### Using the Server Function

```typescript
import { sendEmailServer } from '@/lib/hooks/useEmail'

const result = await sendEmailServer({
  type: 'custom',
  email: 'user@example.com',
  name: 'John Doe',
  subject: 'Hello!',
  html: '<p>Welcome!</p>',
  text: 'Welcome!',
})
```

## Email Management UI

The application includes a comprehensive Email Management page at `/email-management` with:

1. **Email Composer**: Create and send custom emails, onboarding emails, or completion emails
2. **Inbox Viewer**: View and manage received emails
3. **API Documentation**: Reference for all available endpoints

### Features

- **Multiple Email Types**: Onboarding, completion, and custom emails
- **CC/BCC Support**: Add multiple recipients with CC and BCC options
- **Reply-To**: Set custom reply-to addresses
- **HTML & Text**: Support for both HTML and plain text content
- **Message List**: View all messages with pagination
- **Message Details**: Full message content with extracted text/HTML
- **Dark Mode**: Full dark mode support for all components

## Workflow Integration

The application integrates AgentMail with workflows:

1. When a user signs up, an onboarding email is sent automatically
2. When a workflow completes, a completion email is sent with the workflow ID
3. Custom emails can be sent from any part of the application

### Example: Sending Email in a Workflow

```typescript
// In your workflow handler
const emailResult = await fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'completion',
    email: user.email,
    name: user.name,
    workflowRunId: workflowId,
  }),
})

if (emailResult.ok) {
  console.log('Completion email sent')
}
```

## Troubleshooting

### API Key Not Found

**Error**: `AGENTMAIL_API_KEY is not configured`

**Solution**: Add your API key to your environment variables:
```bash
AGENTMAIL_API_KEY=your_api_key_here
```

### Failed to Create Inbox

**Error**: `Failed to create AgentMail inbox`

**Solution**: 
- Verify your API key is correct
- Check your account quota on AgentMail Console
- Ensure the API key has permission to create inboxes

### Message Not Found

**Error**: `Failed to fetch message`

**Solution**:
- Verify the inbox ID is correct
- Verify the message ID is correct
- The message may have expired (default retention: 30 days)

### Rate Limiting

If you exceed rate limits, the API will return a `429` status code. Implement exponential backoff for retries.

## Migration from Resend

The application has been migrated from Resend to AgentMail. The following changes were made:

1. **Email Client**: Replaced `resend-client.ts` with `agentmail-client.ts`
2. **API Routes**: Updated `/api/email/send` to use AgentMail
3. **New Routes**: Added `/api/email/inbox` for inbox management
4. **Components**: Added `EmailComposer` and `EmailInboxViewer` components
5. **Hooks**: Added `useEmail` hook for client-side email operations
6. **UI Page**: Added `/email-management` page for email management

All existing functionality is preserved, and the API remains compatible with previous code.

## Best Practices

1. **Always include both HTML and text versions** of emails for better compatibility
2. **Use meaningful subject lines** for better email organization
3. **Validate email addresses** before sending
4. **Implement error handling** for failed email sends
5. **Store message IDs** for reference and tracking
6. **Test with real emails** before going to production
7. **Monitor API quota** to avoid hitting rate limits

## Additional Resources

- [AgentMail Documentation](https://agentmail.to/docs)
- [AgentMail API Reference](https://api.agentmail.to/docs)
- [AgentMail Console](https://console.agentmail.to)

## Support

For issues or questions about AgentMail integration:

1. Check the [AgentMail Documentation](https://agentmail.to/docs)
2. Review the [API Reference](https://api.agentmail.to/docs)
3. Contact AgentMail Support: support@agentmail.to
