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
        sql_files = sorted(scripts_dir.glob("*.sql"))
        
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
        
        print(f"\nMigration Summary:")
        print(f"  Total files: {len(sql_files)}")
        print(f"  Newly executed: {executed_count}")
        print(f"  Status: {'SUCCESS' if executed_count >= 0 else 'FAILED'}")
        
        return True
    
    finally:
        await pool.close()


if __name__ == "__main__":
    import asyncio
    success = asyncio.run(run_migrations())
    sys.exit(0 if success else 1)
