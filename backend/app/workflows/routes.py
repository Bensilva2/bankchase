"""
Workflow API Routes
FastAPI routes for triggering and managing workflows
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_

from app.database import get_db
from app.auth.dependencies import get_current_user
from app.workflows.client import get_workflow_client
from app.workflows.models import (
    WorkflowRun, WorkflowEvent, WorkflowHook,
    MoneyTransfer, LoanApplication, PaymentDispute,
    AccountClosure, BillPayment, AccountOpening
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/workflows", tags=["workflows"])

# ============================================================================
# Request/Response Models
# ============================================================================

class WorkflowInput(BaseModel):
    """Input for starting a workflow"""
    workflow_type: str = Field(..., description="Type of workflow")
    payload: Dict[str, Any] = Field(..., description="Workflow input data")
    metadata: Optional[Dict[str, Any]] = None


class TransferInput(WorkflowInput):
    """Money transfer workflow input"""
    from_account_id: str
    to_account_id: str
    amount: float
    reference: Optional[str] = None


class LoanApplicationInput(WorkflowInput):
    """Loan application workflow input"""
    loan_amount: float
    loan_term_months: int
    employment_status: Optional[str] = None
    annual_income: Optional[float] = None


class DisputeInput(WorkflowInput):
    """Payment dispute workflow input"""
    transaction_id: str
    disputed_amount: float
    dispute_reason: str


class BillPaymentInput(WorkflowInput):
    """Bill payment workflow input"""
    payee_name: str
    payee_account: str
    amount: float
    scheduled_date: str
    is_recurring: bool = False
    frequency: Optional[str] = None


class AccountOpeningInput(WorkflowInput):
    """Account opening workflow input"""
    account_type: str = "checking"
    phone_number: str
    email: str


class WorkflowResponse(BaseModel):
    """Workflow execution response"""
    run_id: str
    workflow_type: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class WorkflowDetailResponse(WorkflowResponse):
    """Detailed workflow response"""
    user_id: str
    org_id: str
    input: Dict[str, Any]
    output: Optional[Dict[str, Any]]
    error_message: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]


class HookResumeRequest(BaseModel):
    """Resume a paused workflow"""
    token: str
    payload: Dict[str, Any]


class WebhookRequest(BaseModel):
    """Handle webhook callback"""
    token: str
    data: Dict[str, Any]


# ============================================================================
# Transfer Workflow
# ============================================================================

@router.post("/transfer", response_model=WorkflowResponse)
async def start_transfer_workflow(
    request: TransferInput,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a money transfer workflow"""
    try:
        client = get_workflow_client()
        
        # Start workflow
        result = await client.start_workflow(
            workflow_type="transfer",
            user_id=user_id,
            org_id="default",
            payload=request.payload
        )
        
        # Store in database
        run = WorkflowRun(
            run_id=result["run_id"],
            workflow_name="transfer",
            user_id=user_id,
            org_id="default",
            status="pending",
            input=request.payload
        )
        db.add(run)
        db.commit()
        
        return {
            "run_id": result["run_id"],
            "workflow_type": "transfer",
            "status": "pending",
            "created_at": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Transfer workflow error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/loan-application", response_model=WorkflowResponse)
async def start_loan_application_workflow(
    request: LoanApplicationInput,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a loan application workflow"""
    try:
        client = get_workflow_client()
        
        result = await client.start_workflow(
            workflow_type="loan_application",
            user_id=user_id,
            org_id="default",
            payload=request.payload
        )
        
        run = WorkflowRun(
            run_id=result["run_id"],
            workflow_name="loan_application",
            user_id=user_id,
            org_id="default",
            status="pending",
            input=request.payload
        )
        db.add(run)
        db.commit()
        
        return {
            "run_id": result["run_id"],
            "workflow_type": "loan_application",
            "status": "pending",
            "created_at": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Loan application workflow error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/dispute", response_model=WorkflowResponse)
async def start_dispute_workflow(
    request: DisputeInput,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a payment dispute workflow"""
    try:
        client = get_workflow_client()
        
        result = await client.start_workflow(
            workflow_type="payment_dispute",
            user_id=user_id,
            org_id="default",
            payload=request.payload
        )
        
        run = WorkflowRun(
            run_id=result["run_id"],
            workflow_name="payment_dispute",
            user_id=user_id,
            org_id="default",
            status="pending",
            input=request.payload
        )
        db.add(run)
        db.commit()
        
        return {
            "run_id": result["run_id"],
            "workflow_type": "payment_dispute",
            "status": "pending",
            "created_at": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Dispute workflow error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bill-payment", response_model=WorkflowResponse)
async def start_bill_payment_workflow(
    request: BillPaymentInput,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a bill payment workflow"""
    try:
        client = get_workflow_client()
        
        result = await client.start_workflow(
            workflow_type="bill_payment",
            user_id=user_id,
            org_id="default",
            payload=request.payload
        )
        
        run = WorkflowRun(
            run_id=result["run_id"],
            workflow_name="bill_payment",
            user_id=user_id,
            org_id="default",
            status="pending",
            input=request.payload
        )
        db.add(run)
        db.commit()
        
        return {
            "run_id": result["run_id"],
            "workflow_type": "bill_payment",
            "status": "pending",
            "created_at": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Bill payment workflow error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/account-opening", response_model=WorkflowResponse)
async def start_account_opening_workflow(
    request: AccountOpeningInput,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start an account opening workflow"""
    try:
        client = get_workflow_client()
        
        result = await client.start_workflow(
            workflow_type="account_opening",
            user_id=user_id,
            org_id="default",
            payload=request.payload
        )
        
        run = WorkflowRun(
            run_id=result["run_id"],
            workflow_name="account_opening",
            user_id=user_id,
            org_id="default",
            status="pending",
            input=request.payload
        )
        db.add(run)
        db.commit()
        
        return {
            "run_id": result["run_id"],
            "workflow_type": "account_opening",
            "status": "pending",
            "created_at": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Account opening workflow error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Workflow Status & Management
# ============================================================================

@router.get("/{run_id}", response_model=WorkflowDetailResponse)
async def get_workflow_status(
    run_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get workflow execution status"""
    run = db.query(WorkflowRun).filter(
        and_(
            WorkflowRun.run_id == run_id,
            WorkflowRun.user_id == user_id
        )
    ).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return run


@router.get("/", response_model=List[WorkflowResponse])
async def list_workflows(
    user_id: str = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """List user's workflows"""
    runs = db.query(WorkflowRun).filter(
        WorkflowRun.user_id == user_id
    ).order_by(
        desc(WorkflowRun.created_at)
    ).offset(offset).limit(limit).all()
    
    return runs


@router.get("/{run_id}/events")
async def get_workflow_events(
    run_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed events for a workflow"""
    # Verify ownership
    run = db.query(WorkflowRun).filter(
        and_(
            WorkflowRun.run_id == run_id,
            WorkflowRun.user_id == user_id
        )
    ).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    events = db.query(WorkflowEvent).filter(
        WorkflowEvent.run_id == run_id
    ).order_by(WorkflowEvent.created_at).all()
    
    return events


# ============================================================================
# Hook & Webhook Management
# ============================================================================

@router.post("/hooks/resume")
async def resume_hook(
    request: HookResumeRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Resume a paused workflow"""
    try:
        # Verify hook exists and is active
        hook = db.query(WorkflowHook).filter(
            WorkflowHook.token == request.token
        ).first()
        
        if not hook or not hook.is_active:
            raise HTTPException(status_code=404, detail="Hook not found or expired")
        
        client = get_workflow_client()
        await client.resume_hook(request.token, request.payload)
        
        # Update hook status
        hook.status = "received"
        hook.resume_payload = request.payload
        hook.received_at = datetime.utcnow()
        db.commit()
        
        return {"status": "resumed"}
    except Exception as e:
        logger.error(f"Hook resume error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhooks/callback")
async def handle_webhook_callback(
    request: WebhookRequest,
    db: Session = Depends(get_db)
):
    """Handle incoming webhook callback"""
    try:
        # Verify webhook token
        hook = db.query(WorkflowHook).filter(
            WorkflowHook.token == request.token
        ).first()
        
        if not hook:
            raise HTTPException(status_code=404, detail="Webhook token not found")
        
        client = get_workflow_client()
        await client.handle_webhook(request.token, request.data)
        
        # Update hook
        hook.status = "received"
        hook.resume_payload = request.data
        hook.received_at = datetime.utcnow()
        db.commit()
        
        return {"status": "processed"}
    except Exception as e:
        logger.error(f"Webhook callback error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Health Check
# ============================================================================

@router.get("/health")
async def workflow_health():
    """Health check for workflow system"""
    return {
        "status": "healthy",
        "service": "workflow",
        "timestamp": datetime.utcnow()
    }
