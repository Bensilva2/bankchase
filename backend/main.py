"""
FastAPI application entry point
Initializes the app and registers all routes
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import (
    accounts_router,
    transactions_router,
    pay_transfer_router,
    admin_demo_router,
    drift_router,
    webhooks_router,
)

# Initialize FastAPI app
app = FastAPI(
    title="BankChase API",
    description="Banking API with behavioral drift detection and webhook support",
    version="0.1.0",
)

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
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
