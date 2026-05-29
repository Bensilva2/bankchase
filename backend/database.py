"""
Database connection module using asyncpg for PostgreSQL
"""
import os
import asyncpg
from contextlib import asynccontextmanager
from typing import AsyncGenerator

DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")

pool: asyncpg.Pool | None = None


async def init_pool():
    """Initialize the database connection pool"""
    global pool
    if pool is None:
        pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=1,
            max_size=10,
            command_timeout=60
        )
    return pool


async def close_pool():
    """Close the database connection pool"""
    global pool
    if pool:
        await pool.close()
        pool = None


@asynccontextmanager
async def get_connection() -> AsyncGenerator[asyncpg.Connection, None]:
    """Get a connection from the pool"""
    global pool
    if pool is None:
        await init_pool()
    async with pool.acquire() as conn:
        yield conn


async def execute(query: str, *args):
    """Execute a query and return status"""
    async with get_connection() as conn:
        return await conn.execute(query, *args)


async def fetch(query: str, *args) -> list[asyncpg.Record]:
    """Fetch all rows from a query"""
    async with get_connection() as conn:
        return await conn.fetch(query, *args)


async def fetchrow(query: str, *args) -> asyncpg.Record | None:
    """Fetch a single row from a query"""
    async with get_connection() as conn:
        return await conn.fetchrow(query, *args)


async def fetchval(query: str, *args):
    """Fetch a single value from a query"""
    async with get_connection() as conn:
        return await conn.fetchval(query, *args)
