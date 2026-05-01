# Database Schema Documentation

## Overview

The BankChase database schema is designed to support durable workflows with complete audit trails, vector embeddings for voice analysis, and behavioral anomaly detection.

## Core Workflow Tables

### 1. `workflow_runs` (012_create_workflow_runs.sql)
Central table tracking all workflow executions. Every workflow instantiation creates a record here.

**Fields:**
- `run_id` - Unique identifier returned by Vercel Workflow SDK
- `workflow_name` - Name of the workflow (transfer, loan_application, etc)
- `status` - pending, running, completed, failed, cancelled
- `input` - JSONB of input parameters
- `output` - JSONB of workflow result
- `error_message` - Human-readable error if failed
- `user_id` - User who triggered the workflow
- `org_id` - Organization context

**Key Indexes:**
- user_id, workflow_name, status, created_at for fast queries
- run_id for direct lookups

### 2. `workflow_events` (013_create_workflow_events.sql)
Detailed audit log of every step execution within a workflow.

**Event Types:**
- `step_started` - Step function began
- `step_completed` - Step completed successfully
- `step_failed` - Step failed with error
- `hook_created` - Workflow paused at hook
- `hook_received` - Hook resumed with data
- `workflow_paused` - Workflow waiting for external event
- `workflow_resumed` - Workflow continued after pause

**Fields:**
- `run_id` - Links to workflow_runs
- `step_name` - Name of the step function
- `status` - success, failed, retrying
- `input`, `output` - Step I/O (JSONB)
- `duration_ms` - Execution time
- `retry_count` - Number of retries for this step
- `next_retry_at` - When next retry will occur

### 3. `workflow_hooks` (014_create_workflow_hooks.sql)
Stores hook tokens and resumption payloads for paused workflows.

**Hook Types:**
- `approval` - Wait for user/admin approval
- `upload` - Wait for document/evidence upload
- `payment` - Wait for external payment status
- `kyc_verification` - Wait for KYC verification
- `document_collection` - Wait for user documents

**Fields:**
- `token` - Unique hook token for resumption
- `hook_type` - Type of pause point
- `is_active` - Whether hook can still be resumed
- `status` - pending, received, expired
- `resume_payload` - Data sent to resume workflow
- `metadata` - Additional context
- `expires_at` - When hook expires

## Domain-Specific Tables

### 4. `money_transfers` (015_create_money_transfers.sql)
Linked to transfer workflow runs. Contains transfer-specific business logic.

**Fields:**
- `workflow_run_id` - Links to workflow_runs
- `from_account_id`, `to_account_id` - Account references
- `amount`, `currency` - Transfer amount
- `fraud_score` - AI-calculated fraud risk (0-1)
- `fraud_reason` - Why flagged as fraud
- `reference_number` - Unique transaction reference

### 5. `loan_applications` (016_create_loan_applications.sql)
Linked to loan application workflow runs. Multi-stage approval tracking.

**Key Fields:**
- `credit_score` - User's credit score
- `credit_check_result` - Full credit check response (JSONB)
- `offer_amount`, `offer_term_months`, `offer_interest_rate` - Generated offer
- `offer_expires_at` - When offer expires
- `acceptance_date` - When applicant accepted
- `disbursement_date` - When funds disbursed
- `documents` - Array of uploaded documents with URLs
- `status` - submitted → kyc_pending → credit_check → offer_generated → accepted → approved → disbursed

### 6. `payment_disputes` (017_create_payment_disputes.sql)
Linked to dispute workflow runs. Evidence collection and resolution tracking.

**Key Fields:**
- `transaction_id` - The disputed transaction
- `dispute_reason` - unauthorized, duplicate, amount_mismatch, refund_not_received, quality_issue
- `evidence_files` - User-uploaded evidence (JSONB array)
- `merchant_response` - Merchant's response
- `merchant_evidence` - Merchant-provided evidence
- `resolution` - approved, rejected, partial
- `refund_amount` - Amount refunded to user
- `status` - submitted → under_investigation → evidence_requested → evidence_received → resolved → closed

### 7. `account_closures` (018_create_account_closures.sql)
Linked to account closure workflow runs. Multi-step deactivation.

**Key Fields:**
- `account_id` - Account being closed
- `reason` - account_transfer, inactivity, fraud, customer_request
- `pending_transactions_count` - Transactions pending settlement
- `total_refunded` - Total refunds processed
- `archived_data` - Snapshot of account history (JSONB)
- `status` - initiated → verified → transactions_cleared → refunds_processed → archived → completed

### 8. `bill_payments` (019_create_bill_payments.sql)
Linked to bill payment automation workflow runs. Recurring & one-time payments.

**Key Fields:**
- `payee_name`, `payee_account` - Who payment goes to
- `is_recurring` - Whether payment repeats
- `frequency` - one_time, weekly, biweekly, monthly, quarterly, annually
- `scheduled_date` - When to execute
- `retry_count`, `max_retries` - Retry tracking
- `next_payment_date` - For recurring payments
- `status` - scheduled → pending → processing → completed (or failed → retrying)

### 9. `account_openings` (020_create_account_openings.sql)
Linked to account opening workflow runs. KYC and document verification.

**Key Fields:**
- `kyc_status` - pending, verified, rejected, manual_review
- `documents` - Array of uploaded docs with verification status
- `account_type` - checking, savings, money_market
- `kyc_verified_at` - When KYC completed
- `approved_at`, `approved_by` - Approval tracking
- `status` - initiated → kyc_pending → kyc_verified → documents_requested → documents_received → approved → account_created → completed

## Row-Level Security (RLS)

All tables implement RLS with consistent patterns:

**Workflow Tables:**
```sql
-- Users can only see their own workflow runs and related events/hooks
user_id = auth.uid() OR org_id = (SELECT org_id FROM users WHERE id = auth.uid())
```

**Domain Tables:**
```sql
-- Users can only see data related to their accounts/applications
user_id = auth.uid() OR account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid())
```

## Indexes

All tables have strategic indexes for common queries:
- Primary lookups: run_id, user_id, account_id
- Filtering: status, created_at, is_active
- Domain-specific: workflow_name, hook_type, account_type

## Running Migrations

### From Next.js App
```bash
npm run db:migrate
```

### From Python Backend
```bash
python scripts/run_migrations.py
```

### Manual via psql
```bash
psql $DATABASE_URL < scripts/012_create_workflow_runs.sql
psql $DATABASE_URL < scripts/013_create_workflow_events.sql
# ... etc for all scripts
```

## Vector Embeddings (pgvector)

For voice analysis features, pgvector is already available in Neon:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- Add to behavioral_baselines table:
ALTER TABLE behavioral_baselines 
ADD COLUMN voice_embedding vector(256);

CREATE INDEX ON behavioral_baselines USING ivfflat (voice_embedding vector_cosine_ops);
```

## Audit Trail Best Practices

1. **Every workflow creates a workflow_runs record** - Single source of truth
2. **Every step execution logs to workflow_events** - Complete audit trail
3. **Hooks are timestamped** - Track pause/resume lifecycle
4. **Domain tables record business events** - Transfer completion, loan status, etc
5. **Use created_at DESC indexes** - For recent data queries

## Performance Considerations

- `workflow_runs` indexed on user_id + created_at for dashboards
- `workflow_events` indexed on run_id for single-run inspection
- `bill_payments` indexed on scheduled_date for daily batch queries
- All JSONB columns indexed if queried (input, output, documents, evidence_files)
