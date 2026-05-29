"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ==================== ENUMS ====================

class AccountType(str, Enum):
    checking = "checking"
    savings = "savings"
    credit = "credit"
    demo = "demo"


class TransactionType(str, Enum):
    debit = "debit"
    credit = "credit"


class TransferStatus(str, Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"


class RiskLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class WebhookEventType(str, Enum):
    transfer_completed = "transfer.completed"
    transfer_pending = "transfer.pending"
    transfer_failed = "transfer.failed"
    balance_updated = "balance.updated"


# ==================== AUTH SCHEMAS ====================

class UserCreate(BaseModel):
    email: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class TokenData(BaseModel):
    user_id: str
    org_id: Optional[str] = None
    role: str = "user"
    email: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ==================== ACCOUNT SCHEMAS ====================

class AccountCreate(BaseModel):
    account_type: AccountType = AccountType.checking
    account_name: Optional[str] = None
    initial_balance: float = 0.0


class AccountResponse(BaseModel):
    id: str
    user_id: str
    account_number: str
    account_type: str
    account_name: Optional[str]
    balance: float
    is_demo_account: bool
    created_at: datetime


class AccountsListResponse(BaseModel):
    accounts: List[AccountResponse]
    total_balance: float


# ==================== BANK SCHEMAS ====================

class BankInfo(BaseModel):
    code: str
    name: str
    short_name: Optional[str]
    routing_number: Optional[str]
    swift_code: Optional[str]
    country_code: str


class BanksListResponse(BaseModel):
    country: str
    banks: List[BankInfo]


# ==================== TRANSFER SCHEMAS ====================

class TransferRequest(BaseModel):
    from_account_number: str
    to_account_number: str
    to_bank_code: str
    to_routing_number: Optional[str] = None
    to_swift_code: Optional[str] = None
    amount: float = Field(..., gt=0)
    narration: Optional[str] = None
    country_code: str = "US"
    days_to_refund: int = Field(default=7, ge=1, le=30)
    pin: str = Field(..., description="4-6 digit PIN for transfer verification")

    @field_validator('pin')
    @classmethod
    def validate_pin(cls, v: str) -> str:
        if not v.isdigit() or not (4 <= len(v) <= 6):
            raise ValueError("PIN must be 4-6 digits")
        return v

    @field_validator('to_account_number')
    @classmethod
    def validate_account_number(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or not (4 <= len(v) <= 17):
            raise ValueError("Account number must be 4-17 digits")
        return v

    @field_validator('to_routing_number')
    @classmethod
    def validate_routing_number(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        if len(v) != 9 or not v.isdigit():
            raise ValueError("Routing number must be exactly 9 digits")
        # Mod 10 check digit validation
        weights = [3, 7, 1, 3, 7, 1, 3, 7, 1]
        checksum = sum(int(d) * w for d, w in zip(v, weights))
        if checksum % 10 != 0:
            raise ValueError("Invalid routing number checksum")
        return v


class DemoTransferRequest(BaseModel):
    to_account_number: str
    to_bank_code: str
    to_routing_number: Optional[str] = None
    to_swift_code: Optional[str] = None
    amount: float = Field(..., gt=0)
    country_code: str = "US"
    days_to_refund: int = Field(default=7, ge=1, le=30)

    @field_validator('to_account_number')
    @classmethod
    def validate_account_number(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or not (4 <= len(v) <= 17):
            raise ValueError("Account number must be 4-17 digits")
        return v


class BulkDemoTransferRequest(BaseModel):
    amount: float = Field(..., gt=0)
    days_to_refund: int = Field(default=7, ge=1, le=30)
    note: Optional[str] = None


class ReceiptResponse(BaseModel):
    receipt_id: str
    receipt_number: str
    date: str
    time: str
    from_account: str
    to_account: str
    amount: float
    currency: str = "USD"
    status: str
    reference: str
    narration: Optional[str] = None
    balance_before: Optional[float] = None
    balance_after: Optional[float] = None


class TransferResponse(BaseModel):
    status: str
    message: str
    transfer_id: Optional[str] = None
    debit_transaction_id: Optional[str] = None
    credit_transaction_id: Optional[str] = None
    from_account: str
    to_account: str
    amount: float
    will_refund_in_days: Optional[int] = None
    receipt: Optional[ReceiptResponse] = None


# ==================== TRANSACTION SCHEMAS ====================

class TransactionResponse(BaseModel):
    id: str
    account_id: str
    type: str
    amount: float
    description: Optional[str]
    to_account: Optional[str]
    status: str
    date: datetime


class TransactionHistoryResponse(BaseModel):
    transactions: List[TransactionResponse]
    total_count: int
    limit: int
    offset: int


# ==================== DRIFT DETECTION SCHEMAS ====================

class BehavioralFeatures(BaseModel):
    pause_duration: float = Field(..., ge=0)
    pitch_variation: float = Field(..., ge=0)
    response_latency: float = Field(..., ge=0)
    tempo_wpm: float = Field(..., ge=0)
    disfluency_rate: float = Field(..., ge=0, le=1)


class DriftDetectionRequest(BaseModel):
    user_id: str
    org_id: str
    session_id: Optional[str] = None
    features: BehavioralFeatures
    confidence: float = Field(..., ge=0, le=1)


class DriftDetectionResponse(BaseModel):
    success: bool
    is_new_user: bool
    baseline_id: str
    sample_count: int
    drift_detected: bool
    drift_score: float
    action: str
    risk_level: str
    algorithm_used: str
    deviations: dict
    risk_penalty: float
    consecutive_drift_count: int
    rolling_risk_multiplier: float


# ==================== WEBHOOK SCHEMAS ====================

class WebhookCreate(BaseModel):
    url: str
    events: List[str] = ["transfer.completed", "transfer.pending"]


class WebhookUpdate(BaseModel):
    url: Optional[str] = None
    events: Optional[List[str]] = None
    is_active: Optional[bool] = None


class WebhookResponse(BaseModel):
    id: str
    url: str
    events: List[str]
    is_active: bool
    created_at: datetime


class WebhookEventResponse(BaseModel):
    id: str
    webhook_id: str
    event_type: str
    payload: dict
    status: str
    created_at: datetime
    last_attempt_at: Optional[datetime] = None
    next_retry_at: Optional[datetime] = None
    retry_count: int = 0


# ==================== ERROR RESPONSE ====================

class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None
