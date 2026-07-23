# Upstash Workflow Setup Guide

This guide helps you set up Upstash Workflow with the BankChase onboarding system.

## Quick Start

### 1. Environment Setup

The `.env.local` file is already configured with `QSTASH_DEV=true` for local development.

For production deployment, you'll need:
- `QSTASH_TOKEN` - Your Upstash QStash token (provided by Upstash integration)
- `QSTASH_CURRENT_SIGNING_KEY` - Signing key for request validation
- `QSTASH_NEXT_SIGNING_KEY` - Next signing key for rotation

### 2. Local Development

#### Option A: Automatic Dev Server (Recommended)

With `QSTASH_DEV=true`, the SDK automatically manages the dev server:

```bash
npm run dev
```

The workflow SDK will automatically download and connect to the QStash dev server.

#### Option B: Manual Dev Server

If you prefer manual control, run:

```bash
npm run qstash:dev
```

This will start the QStash development server on port 8000.

Then in another terminal:

```bash
npm run dev
```

### 3. Verify Setup

Check workflow health:

```bash
npm run qstash:health
```

Should return:
```json
{
  "status": "ok"
}
```

## File Structure

```
app/
├── api/
│   ├── workflow/
│   │   └── route.ts          # Main workflow endpoint
│   └── onboarding/
│       └── trigger/
│           └── route.ts      # Trigger endpoint
├── onboarding/
│   └── page.tsx              # Onboarding UI
components/onboarding/
├── onboarding-card.tsx       # Interactive onboarding card
└── icons.tsx                 # SVG icon components
lib/
└── workflow-client.ts        # Workflow client and utilities
```

## Workflow Steps

The onboarding workflow includes these automated steps:

1. **validate-setup** - Validates onboarding configuration
2. **process-api-config** - Processes API configuration
3. **verify-domain** - Verifies domain settings
4. **setup-agent** - Initializes AI agent integration
5. **send-notification** - Sends completion notification

Each step is idempotent and can be retried automatically.

## Usage

### Trigger Workflow from Frontend

The onboarding page includes a button to start the workflow:

1. Complete all onboarding steps
2. Click "Complete All & Start Workflow"
3. The workflow will execute automatically
4. Check the success message with workflow ID

### Trigger Workflow Programmatically

```typescript
import { triggerOnboardingWorkflow } from '@/lib/workflow-client'

const result = await triggerOnboardingWorkflow()
if (result.success) {
  console.log('Workflow ID:', result.workflowRunId)
}
```

## Monitoring

### Local Development

When using the dev server, you can monitor workflows:

```bash
npm run qstash:dev
```

The dev server console shows:
- Workflow triggers
- Step execution
- Errors and retries

### Production

Monitor workflows in the Upstash Console:
- Visit https://console.upstash.com/
- Navigate to QStash → Workflows
- View workflow runs, execution logs, and metrics

## Troubleshooting

### Workflow not triggering

1. Verify `QSTASH_DEV=true` is set for local development
2. Check dev server is running: `npm run qstash:health`
3. Verify API endpoint is accessible

### Signature verification failures

1. Ensure environment variables are set correctly
2. In dev mode, keys are auto-generated
3. For production, use values from Upstash Console

### Steps not executing

1. Check console logs for errors
2. Verify each step function is properly configured
3. Check retry logic and timeout settings

## Next Steps

1. **Customize Steps** - Edit `app/api/workflow/route.ts` to add your logic
2. **Add Notifications** - Integrate with email/Slack for step completion
3. **Track Progress** - Add database records for workflow progress
4. **Deploy** - Push to production with Upstash integration enabled

## Resources

- [Upstash Workflow Docs](https://upstash.com/docs/workflow)
- [QStash Dev Server Guide](https://upstash.com/docs/qstash/howto/local-development)
- [Workflow API Reference](https://upstash.com/docs/workflow/api)
