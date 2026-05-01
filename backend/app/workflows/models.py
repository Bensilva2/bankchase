"""
Workflow Models
SQLAlchemy models for workflow tracking and persistence
"""

from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, JSON, Text, ForeignKey, Index, DECIMAL
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

class WorkflowRun(Base):
    """Track all workflow executions"""
    __tablename__ = "workflow_runs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(String, unique=True, nullable=False, index=True)
    workflow_name = Column(String, nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), index=True)
    org_id = Column(String, default='default', index=True)
    
    status = Column(String, default='pending', index=True)  # pending, running, completed, failed, cancelled
    input = Column(JSONB, nullable=False)
    output = Column(JSONB)
    
    error_message = Column(Text)
    error_code = Column(String)
    
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_workflow_runs_user_workflow', 'user_id', 'workflow_name'),
        Index('idx_workflow_runs_created', 'created_at'),
    )


class WorkflowEvent(Base):
    """Detailed audit trail of workflow execution"""
    __tablename__ = "workflow_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(String, nullable=False, index=True)
    
    event_type = Column(String, nullable=False, index=True)  # step_started, step_completed, etc
    step_name = Column(String, index=True)
    
    status = Column(String, index=True)  # success, failed, retrying
    input = Column(JSONB)
    output = Column(JSONB)
    
    error_message = Column(Text)
    duration_ms = Column(Integer)
    
    retry_count = Column(Integer, default=0)
    next_retry_at = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)


class WorkflowHook(Base):
    """Pause/resume hook tracking"""
    __tablename__ = "workflow_hooks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(String, nullable=False, index=True)
    
    token = Column(String, unique=True, nullable=False, index=True)
    hook_type = Column(String, nullable=False, index=True)
    
    is_active = Column(Boolean, default=True, index=True)
    status = Column(String, default='pending', index=True)  # pending, received, expired
    
    resume_payload = Column(JSONB)
    metadata = Column(JSONB)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    received_at = Column(DateTime(timezone=True))
    expires_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class MoneyTransfer(Base):
    """Money transfer workflow data"""
    __tablename__ = "money_transfers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_run_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    from_account_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    to_account_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    amount = Column(DECIMAL(15, 2), nullable=False)
    currency = Column(String, default='USD')
    
    status = Column(String, default='pending', index=True)
    
    fraud_score = Column(Float)
    fraud_reason = Column(String)
    
    reference_number = Column(String, unique=True)
    notes = Column(Text)
    
    scheduled_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class LoanApplication(Base):
    """Loan application workflow data"""
    __tablename__ = "loan_applications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_run_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    account_id = Column(UUID(as_uuid=True), index=True)
    
    loan_amount = Column(DECIMAL(15, 2), nullable=False)
    loan_term_months = Column(Integer, nullable=False)
    interest_rate = Column(Float)
    monthly_payment = Column(DECIMAL(15, 2))
    
    status = Column(String, default='submitted', index=True)
    
    credit_score = Column(Integer)
    credit_check_result = Column(JSONB)
    
    offer_amount = Column(DECIMAL(15, 2))
    offer_term_months = Column(Integer)
    offer_interest_rate = Column(Float)
    offer_expires_at = Column(DateTime(timezone=True))
    
    acceptance_date = Column(DateTime(timezone=True))
    disbursement_date = Column(DateTime(timezone=True))
    
    rejection_reason = Column(Text)
    rejection_date = Column(DateTime(timezone=True))
    
    documents = Column(JSONB)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class PaymentDispute(Base):
    """Payment dispute workflow data"""
    __tablename__ = "payment_disputes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_run_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    transaction_id = Column(String, nullable=False)
    
    disputed_amount = Column(DECIMAL(15, 2), nullable=False)
    dispute_reason = Column(String, nullable=False)
    
    status = Column(String, default='submitted', index=True)
    
    merchant_name = Column(String)
    transaction_date = Column(DateTime(timezone=True))
    
    evidence_files = Column(JSONB)
    merchant_response = Column(Text)
    merchant_evidence = Column(JSONB)
    
    chargeback_initiated_at = Column(DateTime(timezone=True))
    resolved_at = Column(DateTime(timezone=True))
    
    resolution = Column(String)  # approved, rejected, partial
    refund_amount = Column(DECIMAL(15, 2))
    
    notes = Column(Text)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class AccountClosure(Base):
    """Account closure workflow data"""
    __tablename__ = "account_closures"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_run_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    account_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    status = Column(String, default='initiated', index=True)
    
    reason = Column(String)
    close_reason_details = Column(Text)
    
    pending_transactions_count = Column(Integer, default=0)
    total_refunded = Column(DECIMAL(15, 2), default=0)
    
    verification_completed_at = Column(DateTime(timezone=True))
    refunds_completed_at = Column(DateTime(timezone=True))
    archived_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    archived_data = Column(JSONB)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class BillPayment(Base):
    """Bill payment automation workflow data"""
    __tablename__ = "bill_payments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_run_id = Column(UUID(as_uuid=True), index=True)
    
    account_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    payee_name = Column(String, nullable=False)
    payee_account = Column(String, nullable=False)
    
    amount = Column(DECIMAL(15, 2), nullable=False)
    currency = Column(String, default='USD')
    
    is_recurring = Column(Boolean, default=False, index=True)
    frequency = Column(String)  # one_time, weekly, biweekly, monthly, etc
    
    status = Column(String, default='scheduled', index=True)
    
    scheduled_date = Column(DateTime(timezone=True), nullable=False, index=True)
    completed_date = Column(DateTime(timezone=True))
    
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    next_retry_at = Column(DateTime(timezone=True))
    
    failure_reason = Column(Text)
    
    reference_number = Column(String, unique=True)
    notes = Column(Text)
    
    next_payment_date = Column(DateTime(timezone=True))
    cancelled_at = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class AccountOpening(Base):
    """Account opening workflow data"""
    __tablename__ = "account_openings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_run_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    account_id = Column(UUID(as_uuid=True), index=True)
    
    status = Column(String, default='initiated', index=True)
    
    account_type = Column(String, default='checking')
    
    kyc_status = Column(String, default='pending', index=True)
    kyc_verified_at = Column(DateTime(timezone=True))
    kyc_rejection_reason = Column(Text)
    
    documents_requested_at = Column(DateTime(timezone=True))
    documents = Column(JSONB)
    
    approved_at = Column(DateTime(timezone=True))
    approved_by = Column(String)
    
    account_created_at = Column(DateTime(timezone=True))
    account_number = Column(String)
    
    rejection_reason = Column(Text)
    rejected_at = Column(DateTime(timezone=True))
    
    phone_number = Column(String)
    email = Column(String)
    
    metadata = Column(JSONB)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
