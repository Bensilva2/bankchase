"""
Bank seeding script
Creates initial bank list and demo bank codes
"""
import asyncpg
import os
import sys
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL or POSTGRES_URL environment variable not set")
    sys.exit(1)


BANKS_DATA = [
    ("Chase Bank", "CHASUS33", "021000021", "US", True),
    ("Bank of America", "BOFAUS3N", "026009593", "US", True),
    ("Wells Fargo", "WFBIUS6S", "121000248", "US", True),
    ("Citibank", "CITIUS33", "021000089", "US", True),
    ("US Bank", "USBKUS44", "091000019", "US", True),
    ("TD Bank", "NRTHUS33", "011103093", "US", True),
    ("PNC Bank", "PNCCUS33", "043000096", "US", True),
    ("Capital One", "COUSUSAA", "061000146", "US", True),
    ("HSBC USA", "HSBCUS33", "021001088", "US", True),
    ("ING Direct", "INGAUS33", "031101169", "US", True),
    ("Barclays", "BARCUS33", "026002797", "GB", True),
    ("Deutsche Bank", "DEUTDE33", "12500001", "DE", True),
    ("ING Netherlands", "INGBNL2A", "121000248", "NL", True),
    ("Banco Bilbao Vizcaya", "BBVAESM", "0182", "ES", True),
    ("BNP Paribas", "BNPAFR22", "30066", "FR", True),
]

DEMO_ACCOUNTS_DATA = [
    ("demo_source", "1234567890", "CHASE", "021000021", 50000.00, "USD"),
    ("test_user_1", "0987654321", "BOFA", "026009593", 25000.00, "USD"),
    ("test_user_2", "1111222233", "WELLS", "121000248", 15000.00, "USD"),
    ("test_user_3", "4444555566", "CITI", "021000089", 30000.00, "USD"),
]


async def seed_banks():
    """Seed the banking database with banks and demo accounts"""
    pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5)
    
    try:
        async with pool.acquire() as conn:
            # Check if banks table exists
            table_exists = await conn.fetchval("""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_name = 'banks'
                )
            """)
            
            if not table_exists:
                print("ERROR: 'banks' table does not exist. Run migrations first.")
                return False
            
            # Check if accounts table exists
            accounts_exists = await conn.fetchval("""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_name = 'accounts'
                )
            """)
            
            if not accounts_exists:
                print("ERROR: 'accounts' table does not exist. Run migrations first.")
                return False
            
            # Seed banks
            print("Seeding banks...")
            for name, swift_code, routing_number, country, is_active in BANKS_DATA:
                try:
                    await conn.execute("""
                        INSERT INTO banks (name, swift_code, routing_number, country_code, is_active)
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (swift_code) DO NOTHING
                    """, name, swift_code, routing_number, country, is_active)
                except Exception as e:
                    print(f"  Skipped: {name} (already exists)")
            
            print(f"✓ Seeded {len(BANKS_DATA)} banks")
            
            # Seed demo accounts
            print("\nSeeding demo accounts...")
            for username, account_number, bank_code, routing_number, balance, currency in DEMO_ACCOUNTS_DATA:
                try:
                    await conn.execute("""
                        INSERT INTO accounts (
                            username, account_number, bank_code, routing_number, balance, currency
                        ) VALUES ($1, $2, $3, $4, $5, $6)
                        ON CONFLICT (account_number) DO UPDATE
                        SET balance = EXCLUDED.balance
                    """, username, account_number, bank_code, routing_number, balance, currency)
                except Exception as e:
                    print(f"  Skipped: {username} (error: {str(e)[:50]})")
            
            print(f"✓ Seeded {len(DEMO_ACCOUNTS_DATA)} demo accounts")
            
            # Verify seeds
            bank_count = await conn.fetchval("SELECT COUNT(*) FROM banks")
            account_count = await conn.fetchval("SELECT COUNT(*) FROM accounts")
            
            print(f"\nSeed Summary:")
            print(f"  Total banks: {bank_count}")
            print(f"  Total demo accounts: {account_count}")
            
            return True
    
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return False
    
    finally:
        await pool.close()


if __name__ == "__main__":
    import asyncio
    success = asyncio.run(seed_banks())
    sys.exit(0 if success else 1)
