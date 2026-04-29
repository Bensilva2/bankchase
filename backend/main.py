"""
FastAPI application entry point
Initializes the app and registers all routes with background webhook processor
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio

from routes import (
    accounts_router,
    transactions_router,
    pay_transfer_router,
    admin_demo_router,
    drift_router,
    webhooks_router,
)
from utils.webhook_queue import process_webhook_queue
from utils.rate_limiting import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler


# Background task variables
_webhook_processor_task = None


async def _start_webhook_processor():
    """Start the webhook queue processor background task"""
    global _webhook_processor_task
    _webhook_processor_task = asyncio.create_task(process_webhook_queue())
    print("[v0] Webhook queue processor started")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager - handles startup and shutdown"""
    # Startup
    await _start_webhook_processor()
    yield
    # Shutdown
    if _webhook_processor_task:
        _webhook_processor_task.cancel()
        try:
            await _webhook_processor_task
        except asyncio.CancelledError:
            pass
    print("[v0] Webhook queue processor stopped")


# Initialize FastAPI app with lifespan
app = FastAPI(
    title="BankChase API",
    description="Banking API with behavioral drift detection and webhook support",
    version="0.1.0",
    lifespan=lifespan,
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(accounts_router, prefix="/api/accounts", tags=["accounts"])
app.include_router(transactions_router, prefix="/api/transactions", tags=["transactions"])
app.include_router(pay_transfer_router, prefix="/api/transfers", tags=["transfers"])
app.include_router(admin_demo_router, prefix="/api/admin", tags=["admin"])
app.include_router(drift_router, prefix="/api/drift", tags=["drift"])
app.include_router(webhooks_router, prefix="/api/webhooks", tags=["webhooks"])


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "webhook_processor": "running" if _webhook_processor_task else "stopped"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
