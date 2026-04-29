#!/usr/bin/env python3
"""
Migration runner for PostgreSQL setup scripts
Executes all SQL files in order from scripts/ directory
"""
import asyncpg
import os
import sys
from pathlib import Path

DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")

async def run_migrations():
    """Run all SQL migration files in order"""
    if not DATABASE_URL:
        print("Error: DATABASE_URL or POSTGRES_URL environment variable not set")
        sys.exit(1)
    
    try:
        # Connect to database
        conn = await asyncpg.connect(DATABASE_URL)
        print("[v0] Connected to database")
        
        # Get all SQL files and sort them
        scripts_dir = Path(__file__).parent
        sql_files = sorted(scripts_dir.glob("*.sql"))
        
        if not sql_files:
            print("[v0] No SQL files found in scripts directory")
            await conn.close()
            return
        
        # Execute each SQL file
        for sql_file in sql_files:
            print(f"[v0] Running migration: {sql_file.name}")
            with open(sql_file, 'r') as f:
                sql_content = f.read()
            
            try:
                await conn.execute(sql_content)
                print(f"[v0] ✓ Completed: {sql_file.name}")
            except Exception as e:
                print(f"[v0] ✗ Error in {sql_file.name}: {str(e)}")
                await conn.close()
                raise
        
        await conn.close()
        print("[v0] All migrations completed successfully")
        
    except Exception as e:
        print(f"[v0] Migration failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_migrations())
