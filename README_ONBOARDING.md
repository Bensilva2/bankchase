# BankChase AI Onboarding System

Complete AI-powered onboarding system with Resend integration and Upstash Workflow automation.

## 🚀 Quick Start (2 minutes)

```bash
# Start development
npm run dev

# Visit http://localhost:3000/onboarding
# Complete the 8 onboarding steps
# Click "Complete All & Start Workflow"
# View execution at http://localhost:3000/workflows
```

## 📋 Documentation Index

Read these in order based on your needs:

### For Everyone
- **[ONBOARDING_COMPLETE.md](./ONBOARDING_COMPLETE.md)** - Overview of what's built
- **This file (README_ONBOARDING.md)** - Navigation guide

### For Developers
- **[WORKFLOW_SETUP.md](./WORKFLOW_SETUP.md)** - Workflow setup and configuration
- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Complete technical integration details

### For Deployment
- See "Production Deployment" section below

## 🎯 What's Included

### Frontend Features
- **Interactive Onboarding** - 8 steps with Resend SVG icons
- **Progress Tracking** - Visual 0-100% progress bar
- **Step Details** - Features and descriptions for each step
- **Workflow Trigger** - One-click automation start

### Backend Features
- **5-Step Workflow** - Validate, configure, verify, setup, notify
- **Durability** - Automatic retries and error handling
- **Local Dev Server** - Upstash QStash dev server built-in
- **Real-time Monitoring** - Dashboard for workflow tracking

### Pages & Routes
```
Pages:
  /onboarding      - Interactive onboarding flow
  /workflows       - Workflow monitoring dashboard

API Routes:
  POST /api/onboarding/trigger      - Start workflow
  GET  /api/onboarding/status       - Check status
  POST /api/workflow                - Workflow executor
```

## 📁 Project Structure

```
app/
├── api/
│   ├── workflow/route.ts          # 5-step automation
│   └── onboarding/
│       ├── trigger/route.ts       # Start workflow
│       └── status/route.ts        # Check status
├── onboarding/page.tsx             # Onboarding page
└── workflows/page.tsx              # Monitoring page

components/onboarding/
├── onboarding-card.tsx             # Interactive card
├── workflow-dashboard.tsx          # Monitor workflows
└── icons.tsx                       # Resend SVG icons

lib/
└── workflow-client.ts              # Workflow utilities

Docs:
├── ONBOARDING_COMPLETE.md          # Complete overview
├── WORKFLOW_SETUP.md               # Workflow configuration
├── INTEGRATION_GUIDE.md            # Technical details
└── README_ONBOARDING.md            # This file
```

## 🔧 Configuration

### Local Development

The project is pre-configured for local development. Just run:

```bash
npm run dev
```

Key configuration in `.env.local`:
```env
QSTASH_DEV=true
```

This enables:
- Automatic QStash dev server download
- Automatic request signing
- Local workflow execution
- Console logging

### Production Deployment

To deploy to production, add these Vercel environment variables:

```env
QSTASH_TOKEN=your_upstash_token
QSTASH_CURRENT_SIGNING_KEY=current_key
QSTASH_NEXT_SIGNING_KEY=next_key
```

Get these from: https://console.upstash.com → QStash

Then deploy:
```bash
git push origin main
```

## 🎨 User Experience

### Onboarding Flow
1. Visit `/onboarding` page
2. See 8 interactive steps (Pica, Parsley, Leap, etc.)
3. Click each step to view details
4. Mark steps as complete
5. Progress bar updates (0-100%)
6. Click "Complete All & Start Workflow"
7. See success toast with workflow ID

### Monitoring Flow
1. Visit `/workflows` page
2. See all workflow runs
3. Click a run to view details
4. See step-by-step execution
5. View timing and status
6. Statistics dashboard

## 🔄 Workflow Automation

When user clicks "Start Workflow", this happens automatically:

```
Step 1: validate-setup
  └─ Validates onboarding configuration

Step 2: process-api-config
  └─ Processes API settings

Step 3: verify-domain
  └─ Verifies domain setup

Step 4: setup-agent
  └─ Initializes AI agent

Step 5: send-notification
  └─ Sends completion notification
```

Each step:
- Runs durably (retries on failure)
- Logs to console
- Returns status
- Can be customized

## 🧪 Testing

### Test Locally
```bash
# Start dev server
npm run dev

# In another terminal, trigger workflow
curl -X POST http://localhost:3000/api/onboarding/trigger

# Check console for [Workflow] logs
```

### View Workflow Logs
```bash
# Check your npm run dev console output
# Look for logs prefixed with [Workflow]

[Workflow] Validating onboarding setup...
[Workflow] Processing API configuration...
[Workflow] Verifying domain...
[Workflow] Setting up AI agent...
[Workflow] Sending completion notification...
```

## 📊 Monitoring

### Dashboard View
- Navigate to `/workflows` page
- See workflow run statistics
- View step-by-step execution
- Check execution timing
- Monitor failures

### Console View
```bash
npm run dev
# Look for [Workflow] prefixed messages in terminal
```

### Production View
1. Go to https://console.upstash.com
2. Navigate to QStash → Workflows
3. View workflow runs
4. See execution logs
5. Check retry history

## 🚨 Troubleshooting

### Workflow not starting?
1. Check `/onboarding` page loads
2. Verify all 8 steps are marked complete
3. Check browser console for errors
4. Look at server console for [Workflow] logs

### Workflow failing?
1. Check `npm run dev` console for errors
2. Verify environment variables
3. Check `/workflows` dashboard for details
4. Review step execution logs

### Build issues?
```bash
# Clean and rebuild
rm -rf .next node_modules
npm install
npm run build
```

## 🔗 Integration Points

### Frontend → Backend
- POST `/api/onboarding/trigger` - Start workflow
- GET `/api/onboarding/status?runId=...` - Check status

### Backend → Upstash
- Uses `@upstash/workflow` client
- Triggers `/api/workflow` endpoint
- QStash handles routing and signing

### Upstash → Your App
- Routes webhook to `/api/workflow`
- Signs requests for verification
- Manages retries and scheduling

## 📈 Next Steps

### Customize
1. Edit workflow steps in `/app/api/workflow/route.ts`
2. Update onboarding content in `/components/onboarding/`
3. Modify styling with Tailwind

### Integrate
1. Add database for user progress
2. Send real emails with Resend
3. Notify team on Slack
4. Track analytics

### Deploy
1. Set Upstash env vars
2. Push to GitHub
3. Vercel auto-deploys
4. Monitor in production

## 🎓 Learn More

- [Upstash Workflow Docs](https://upstash.com/docs/workflow)
- [Resend Email API](https://resend.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)

## 📞 Support

For specific help:
- **Setup questions** → See [WORKFLOW_SETUP.md](./WORKFLOW_SETUP.md)
- **Technical details** → See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- **Overview** → See [ONBOARDING_COMPLETE.md](./ONBOARDING_COMPLETE.md)
- **API docs** → Check inline comments in route files

## ✅ Deployment Checklist

Before deploying to production:

- [ ] Read [WORKFLOW_SETUP.md](./WORKFLOW_SETUP.md)
- [ ] Set `QSTASH_TOKEN` in Vercel
- [ ] Set `QSTASH_CURRENT_SIGNING_KEY` in Vercel
- [ ] Set `QSTASH_NEXT_SIGNING_KEY` in Vercel
- [ ] Test locally with `npm run dev`
- [ ] Push to GitHub
- [ ] Verify deployment in Vercel
- [ ] Monitor first workflows in production
- [ ] Check Upstash Console for logs

## 🎉 Summary

You now have a complete, production-ready AI onboarding system with:

✅ Interactive UI with 8 onboarding steps  
✅ Real-time workflow automation  
✅ Comprehensive monitoring dashboard  
✅ Local development environment  
✅ Production deployment ready  

**Start with:** `npm run dev` → Visit `/onboarding` → Enjoy! 🚀
