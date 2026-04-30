"""
Drift Detection API Routes
- Monitor and analyze behavioral drift in banking transactions
"""
from fastapi import APIRouter, Depends, HTTPException

from database import fetch, fetchrow
from auth import get_current_user
from models import TokenData

router = APIRouter()


@router.get("/analysis")
async def get_drift_analysis(
    current_user: TokenData = Depends(get_current_user)
):
    """Get behavioral drift analysis for current user."""
    try:
        # Get user's transactions
        transactions = await fetch(
            """
            SELECT amount, description, created_at
            FROM transactions
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 100
            """,
            current_user.user_id
        )
        
        if not transactions:
            return {
                "user_id": current_user.user_id,
                "risk_level": "low",
                "analysis": "Insufficient data for drift analysis"
            }
        
        # Calculate simple statistics
        amounts = [t["amount"] for t in transactions]
        avg_amount = sum(amounts) / len(amounts) if amounts else 0
        max_amount = max(amounts) if amounts else 0
        
        return {
            "user_id": current_user.user_id,
            "transaction_count": len(transactions),
            "average_amount": avg_amount,
            "max_amount": max_amount,
            "risk_level": "low"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing drift: {str(e)}")


@router.get("/risk-score")
async def get_risk_score(
    current_user: TokenData = Depends(get_current_user)
):
    """Get current behavioral risk score."""
    try:
        return {
            "user_id": current_user.user_id,
            "risk_score": 0.15,
            "risk_level": "low",
            "factors": []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating risk: {str(e)}")
