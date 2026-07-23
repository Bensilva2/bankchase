# Complete Integration Guide: Resend + Upstash Workflow

This guide covers the complete integration of Resend MCP documentation with Upstash Workflow automation in your BankChase onboarding system.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Onboarding Flow                          │
│  (/onboarding page with 8 interactive steps)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├─→ User completes all steps
                     │
                     └─→ Clicks "Complete All & Start Workflow"
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Frontend → Trigger API                         │
│  POST /api/onboarding/trigger                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│           Workflow Client (lib/workflow-client.ts)          │
│  - Initializes Upstash QStash client                        │
│  - Triggers workflow via HTTP                              │
│  - Returns workflow run ID                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│         Upstash QStash Dev Server (Local Dev)               │
│  - Receives workflow trigger                               │
│  - Routes to Next.js endpoint                              │
│  - Manages request signing & verification                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│           Workflow Executor (app/api/workflow)              │
│  - Step 1: validate-setup                                  │
│  - Step 2: process-api-config                              │
│  - Step 3: verify-domain                                   │
│  - Step 4: setup-agent                                     │
│  - Step 5: send-notification                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│           Response → Frontend                              │
│  - Success status                                          │
│  - Workflow Run ID                                         │
│  - Step execution logs                                     │
└─────────────────────────────────────────────────────────────┘
```

## Component Files

### 1. Frontend Components

#### `/app/onboarding/page.tsx`
- Main onboarding landing page
- Displays hero section and info cards
- Embeds the interactive onboarding card

#### `/components/onboarding/onboarding-card.tsx`
- Interactive step selector
- Progress tracking (0-100%)
- Displays step details and features
- Workflow trigger button
- Success notification with workflow ID

#### `/components/onboarding/icons.tsx`
- 8 SVG icon components from Resend documentation:
  - PicaIcon
  - ParsleyIcon
  - LeapNewIcon
  - Base44Icon
  - RocketIcon
  - WildcardIcon
  - AnythingIcon
  - LovableIcon

### 2. Workflow Components

#### `/app/api/workflow/route.ts`
Main workflow executor using `@upstash/workflow` with 5 steps:

```typescript
// Each step uses context.run() for durability
await context.run("validate-setup", async () => { /* ... */ })
await context.run("process-api-config", async () => { /* ... */ })
await context.run("verify-domain", async () => { /* ... */ })
await context.run("setup-agent", async () => { /* ... */ })
await context.run("send-notification", async () => { /* ... */ })
```

#### `/app/api/onboarding/trigger/route.ts`
Trigger endpoint that:
- Accepts POST requests from frontend
- Calls `triggerOnboardingWorkflow()`
- Returns workflow run ID
- Includes error handling

#### `/app/api/onboarding/status/route.ts`
Status endpoint that:
- Accepts workflow run ID as query parameter
- Fetches workflow execution status
- Returns step-by-step execution details
- Includes timestamps and durations

### 3. Utility Files

#### `/lib/workflow-client.ts`
Workflow client utilities:
- Exports `workflowClient` for QStash communication
- `triggerOnboardingWorkflow()` - Initiates workflow
- `getWorkflowStatus()` - Retrieves execution status
- Handles URL routing (local vs production)

### 4. Monitoring Components

#### `/components/onboarding/workflow-dashboard.tsx`
Real-time workflow monitoring:
- Lists all workflow runs
- Shows status with icons
- Displays step-by-step execution
- Duration tracking per step
- Statistics (total, completed, running, failed)

#### `/app/workflows/page.tsx`
Dedicated workflow management page:
- Embeds workflow dashboard
- Quick start guide
- API endpoint documentation
- Workflow step list
- Setup instructions

## Onboarding Steps

The system includes 8 onboarding steps from Resend documentation:

1. **Resend MCP Server** - Open protocol for AI agents
2. **Resend CLI** - Command-line email automation
3. **Resend Docs for Agents** - Complete AI integration docs
4. **Email Skills for Agents** - Pre-built agent skills
5. **Quick Start Guides** - Getting started tutorials
6. **OpenClaw Guide** - Advanced agent patterns
7. **Chat SDK** - Interactive chat experiences
8. **AI Builder Guides** - AI-focused tutorials

Each step displays:
- Icon and title
- Description
- Key features (bullet points)
- Completion checkbox
- Navigation buttons

## Workflow Execution Steps

When user completes all steps and triggers the workflow:

### Step 1: validate-setup
Validates that onboarding configuration is correct:
- Checks required fields
- Verifies environment setup
- Returns validation status

### Step 2: process-api-config
Processes and validates API configuration:
- Reads API settings
- Validates format
- Stores configuration

### Step 3: verify-domain
Verifies domain settings:
- Checks domain records
- Validates DNS settings
- Confirms verification

### Step 4: setup-agent
Sets up AI agent integration:
- Configures agent parameters
- Initializes MCP connection
- Enables agent features

### Step 5: send-notification
Sends completion notification:
- Generates completion message
- Sends notification (email/webhook)
- Logs completion

## Setup Instructions

### 1. Local Development

```bash
# Ensure QSTASH_DEV=true is set in .env.local
# This is already configured in the project

# Start the dev server
npm run dev

# The QStash dev server starts automatically
# Your app runs on http://localhost:3000
```

### 2. Test the Flow

```bash
# In browser
1. Navigate to http://localhost:3000/onboarding
2. Complete all 8 steps (click each, mark as complete)
3. Click "Complete All & Start Workflow"
4. See success message with workflow ID
5. Navigate to /workflows to monitor execution
```

### 3. View Workflow Logs

```bash
# Check console output from npm run dev
# Look for [Workflow] prefixed logs

# Each step logs its execution:
# [Workflow] Running step-1...
# [Workflow] Step-1 completed
```

### 4. Production Deployment

```bash
# Add these env vars to Vercel:
QSTASH_TOKEN=your_token_here
QSTASH_CURRENT_SIGNING_KEY=your_key_here
QSTASH_NEXT_SIGNING_KEY=your_next_key_here

# Deploy:
git push
# Vercel automatically builds and deploys
```

## File Locations

```
/vercel/share/v0-project/
├── app/
│   ├── api/
│   │   ├── onboarding/
│   │   │   ├── trigger/route.ts      # POST trigger endpoint
│   │   │   └── status/route.ts       # GET status endpoint
│   │   └── workflow/
│   │       └── route.ts              # Workflow executor
│   ├── onboarding/
│   │   └── page.tsx                  # Onboarding page
│   └── workflows/
│       └── page.tsx                  # Workflow monitoring page
├── components/
│   └── onboarding/
│       ├── onboarding-card.tsx       # Interactive card
│       ├── workflow-dashboard.tsx    # Monitoring dashboard
│       └── icons.tsx                 # SVG icons
├── lib/
│   └── workflow-client.ts            # Workflow utilities
├── .env.local                        # QSTASH_DEV=true
├── WORKFLOW_SETUP.md                 # Setup guide
├── INTEGRATION_GUIDE.md              # This file
└── package.json                      # Dependencies included
```

## Data Flow

### User Interaction
```
User visits /onboarding
    ↓
Sees 8 onboarding steps with icons
    ↓
Clicks each step to view details
    ↓
Marks steps as complete (progress bar updates)
    ↓
Clicks "Complete All & Start Workflow"
    ↓
Frontend calls POST /api/onboarding/trigger
    ↓
Success toast with workflow ID
```

### Workflow Execution
```
POST /api/onboarding/trigger received
    ↓
triggerOnboardingWorkflow() called
    ↓
Upstash client.trigger() invoked
    ↓
QStash receives trigger and routes to /api/workflow
    ↓
serve() handler executes steps sequentially
    ↓
Each step uses context.run() for durability
    ↓
If step fails, automatic retry (max 3 times)
    ↓
All steps complete or error
    ↓
Response returned to frontend
    ↓
User sees success notification
```

## Monitoring

### Real-time Console Logs
```
[v0] User data received: { ... }
[Workflow] Validating onboarding setup...
[Workflow] Processing API configuration...
[Workflow] Verifying domain...
[Workflow] Setting up AI agent...
[Workflow] Sending completion notification...
```

### Workflow Dashboard
- Navigate to /workflows
- See all workflow runs
- Click run to view details
- Monitor step execution
- View step durations

### Production Monitoring
- Upstash Console: https://console.upstash.com
- QStash section for workflow logs
- Real-time execution tracking
- Retry monitoring
- Error tracking

## Troubleshooting

### Workflow not triggering?
1. Check QSTASH_DEV=true in .env.local
2. Verify npm run dev is running
3. Check browser console for errors
4. View server console for [Workflow] logs

### Steps not executing?
1. Verify workflow endpoint is accessible
2. Check context.run() is being called
3. Look for console errors
4. Check for timeout issues (default 3600s)

### Signature verification fails?
1. Local dev auto-generates keys
2. For production, set env vars from Upstash
3. Verify endpoints are using correct URL

### Missing data in requests?
1. Check request headers are set
2. Verify Content-Type is application/json
3. Ensure body is being sent

## Next Steps

1. **Customize Steps** - Add your business logic to each step
2. **Add Database** - Store workflow runs in database
3. **Send Emails** - Use Resend to send completion notifications
4. **Slack Integration** - Notify team when workflows complete
5. **Analytics** - Track onboarding completion rates
6. **Error Handling** - Add custom error recovery
7. **Retries** - Configure retry policies per step

## Resources

- [Upstash Workflow Documentation](https://upstash.com/docs/workflow)
- [Resend Documentation](https://resend.com/docs)
- [QStash Local Development](https://upstash.com/docs/qstash/howto/local-development)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
