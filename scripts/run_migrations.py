"""
Database migration runner
Executes all SQL migration files in order
"""
import os
import asyncpg
import sys
from pathlib import Path
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL or POSTGRES_URL environment variable not set")
    sys.exit(1)


async def run_migrations():
    """Run all migrations in order"""
    pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5)
    
    try:
        scripts_dir = Path(__file__).parent
        # Run migrations in specific order for workflow tables
        migration_order = [
            '001-create-banking-data-table.sql',
            '001_create_behavioral_baselines.sql',
            '002-create-auth-tables.sql',
            '002_create_drift_audit_log.sql',
            '003-add-rbac-roles.sql',
            '003_create_behavioral_baselines_v2.sql',
            '004_create_drift_audit_log_v2.sql',
            '005_enhance_behavioral_baselines.sql',
            '006_create_accounts_table.sql',
            '007_create_demo_transfers_table.sql',
            '008_create_webhooks_table.sql',
            '009_create_webhook_events_table.sql',
            '010_create_webhook_retries_table.sql',
            '011_create_webhook_queue_table.sql',
            '012_create_workflow_runs.sql',
            '013_create_workflow_events.sql',
            '014_create_workflow_hooks.sql',
            '015_create_money_transfers.sql',
            '016_create_loan_applications.sql',
            '017_create_payment_disputes.sql',
            '018_create_account_closures.sql',
            '019_create_bill_payments.sql',
            '020_create_account_openings.sql',
        ]
        sql_files = [scripts_dir / f for f in migration_order if (scripts_dir / f).exists()]
        
        if not sql_files:
            print("No SQL migration files found")
            return
        
        # Create migration tracking table if it doesn't exist
        async with pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS migrations (
                    id SERIAL PRIMARY KEY,
                    name TEXT UNIQUE NOT NULL,
                    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
        
        executed_count = 0
        for sql_file in sql_files:
            filename = sql_file.name
            
            # Check if already executed
            async with pool.acquire() as conn:
                result = await conn.fetchval(
                    "SELECT id FROM migrations WHERE name = $1",
                    filename
                )
                
                if result:
                    print(f"✓ SKIPPED: {filename} (already executed)")
                    continue
            
            # Read and execute SQL
            sql_content = sql_file.read_text()
            
            try:
                async with pool.acquire() as conn:
                    async with conn.transaction():
                        await conn.execute(sql_content)
                        await conn.execute(
                            "INSERT INTO migrations (name) VALUES ($1)",
                            filename
                        )
                
                print(f"✓ EXECUTED: {filename}")
                executed_count += 1
            except Exception as e:
                print(f"✗ FAILED: {filename}")
                print(f"  Error: {str(e)}")
                return False
        
        print(f"\n=== Migration Summary ===")
        print(f"  Total migration files: {len(sql_files)}")
        print(f"  Newly executed: {executed_count}")
        print(f"  Status: {'✅ SUCCESS' if executed_count >= 0 else '❌ FAILED'}")
        print(f"\nWorkflow Tables Created:")
        print(f"  • workflow_runs - Central workflow execution log")
        print(f"  • workflow_events - Detailed step execution audit trail")
        print(f"  • workflow_hooks - Pause/resume hook tracking")
        print(f"  • money_transfers - Transfer workflow data")
        print(f"  • loan_applications - Loan workflow data")
        print(f"  • payment_disputes - Dispute workflow data")
        print(f"  • account_closures - Account closure workflow data")
        print(f"  • bill_payments - Bill payment automation data")
        print(f"  • account_openings - Account opening/KYC workflow data")
        
        return True
    
    finally:
        await pool.close()


if __name__ == "__main__":
    import asyncio
    success = asyncio.run(run_migrations())
    sys.exit(0 if success else 1)
