from .accounts import router as accounts_router
from .transactions import router as transactions_router
from .pay_transfer import router as pay_transfer_router
from .admin_demo import router as admin_demo_router
from .drift import router as drift_router

__all__ = [
    "accounts_router",
    "transactions_router",
    "pay_transfer_router",
    "admin_demo_router",
    "drift_router",
]
