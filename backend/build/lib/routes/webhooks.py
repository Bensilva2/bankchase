"""
Webhook Management API Routes
- Create, read, update, delete webhooks
- View webhook events and retry history
"""
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime

from database import fetch, fetchrow, execute
from auth import get_current_user
from models import (
    TokenData,
    WebhookCreate,
    WebhookUpdate,
    WebhookResponse,
    WebhookEventResponse,
)
from utils.webhook_retry import get_webhook_stats, process_pending_retries

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("", response_model=WebhookResponse)
async def create_webhook(
    webhook_data: WebhookCreate,
    current_user: TokenData = Depends(get_current_user)
):
    """
    Create a new webhook for the current user.
    
    The webhook will receive events for the specified event types.
    """
    # Validate URL format
    if not webhook_data.url.startswith(("http://", "https://")):
        raise HTTPException(
            status_code=400,
            detail="Webhook URL must start with http:// or https://"
        )
    
    # Validate events
    valid_events = ["transfer.completed", "transfer.pending", "transfer.failed", "balance.updated"]
    for event in webhook_data.events:
        if event not in valid_events:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid event type: {event}. Valid events: {', '.join(valid_events)}"
            )
    
    webhook_id = str(uuid.uuid4())
    
    try:
        await execute(
            """
            INSERT INTO webhooks (id, user_id, url, events, is_active, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            """,
            webhook_id,
            current_user.user_id,
            webhook_data.url,
            webhook_data.events,
            True
        )
        
        return WebhookResponse(
            id=webhook_id,
            url=webhook_data.url,
            events=webhook_data.events,
            is_active=True,
            created_at=datetime.utcnow()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating webhook: {str(e)}")


@router.get("", response_model=List[WebhookResponse])
async def list_webhooks(
    current_user: TokenData = Depends(get_current_user)
):
    """Get all webhooks for the current user."""
    try:
        webhooks = await fetch(
            """
            SELECT id, url, events, is_active, created_at
            FROM webhooks
            WHERE user_id = $1
            ORDER BY created_at DESC
            """,
            current_user.user_id
        )
        
        return [
            WebhookResponse(
                id=w["id"],
                url=w["url"],
                events=w["events"],
                is_active=w["is_active"],
                created_at=w["created_at"]
            )
            for w in webhooks
        ]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching webhooks: {str(e)}")


@router.get("/{webhook_id}", response_model=WebhookResponse)
async def get_webhook(
    webhook_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """Get details of a specific webhook."""
    try:
        webhook = await fetchrow(
            """
            SELECT id, url, events, is_active, created_at
            FROM webhooks
            WHERE id = $1 AND user_id = $2
            """,
            webhook_id,
            current_user.user_id
        )
        
        if not webhook:
            raise HTTPException(status_code=404, detail="Webhook not found")
        
        return WebhookResponse(
            id=webhook["id"],
            url=webhook["url"],
            events=webhook["events"],
            is_active=webhook["is_active"],
            created_at=webhook["created_at"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching webhook: {str(e)}")


@router.patch("/{webhook_id}", response_model=WebhookResponse)
async def update_webhook(
    webhook_id: str,
    webhook_data: WebhookUpdate,
    current_user: TokenData = Depends(get_current_user)
):
    """Update a webhook's configuration."""
    try:
        # First verify ownership
        existing = await fetchrow(
            """
            SELECT id FROM webhooks
            WHERE id = $1 AND user_id = $2
            """,
            webhook_id,
            current_user.user_id
        )
        
        if not existing:
            raise HTTPException(status_code=404, detail="Webhook not found")
        
        # Build update query dynamically
        updates = []
        params = [webhook_id, current_user.user_id]
        param_count = 2
        
        if webhook_data.url is not None:
            if not webhook_data.url.startswith(("http://", "https://")):
                raise HTTPException(
                    status_code=400,
                    detail="Webhook URL must start with http:// or https://"
                )
            param_count += 1
            updates.append(f"url = ${param_count}")
            params.append(webhook_data.url)
        
        if webhook_data.events is not None:
            valid_events = ["transfer.completed", "transfer.pending", "transfer.failed", "balance.updated"]
            for event in webhook_data.events:
                if event not in valid_events:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid event type: {event}"
                    )
            param_count += 1
            updates.append(f"events = ${param_count}")
            params.append(webhook_data.events)
        
        if webhook_data.is_active is not None:
            param_count += 1
            updates.append(f"is_active = ${param_count}")
            params.append(webhook_data.is_active)
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        await execute(
            f"""
            UPDATE webhooks
            SET {', '.join(updates)}
            WHERE id = $1 AND user_id = $2
            """,
            *params
        )
        
        # Fetch updated webhook
        webhook = await fetchrow(
            """
            SELECT id, url, events, is_active, created_at
            FROM webhooks
            WHERE id = $1
            """,
            webhook_id
        )
        
        return WebhookResponse(
            id=webhook["id"],
            url=webhook["url"],
            events=webhook["events"],
            is_active=webhook["is_active"],
            created_at=webhook["created_at"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating webhook: {str(e)}")


@router.delete("/{webhook_id}")
async def delete_webhook(
    webhook_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """Delete a webhook and its associated events."""
    try:
        # Verify ownership
        existing = await fetchrow(
            """
            SELECT id FROM webhooks
            WHERE id = $1 AND user_id = $2
            """,
            webhook_id,
            current_user.user_id
        )
        
        if not existing:
            raise HTTPException(status_code=404, detail="Webhook not found")
        
        # Delete associated retries first
        await execute(
            """
            DELETE FROM webhook_retries
            WHERE event_id IN (
                SELECT id FROM webhook_events WHERE webhook_id = $1
            )
            """,
            webhook_id
        )
        
        # Delete associated events
        await execute(
            """
            DELETE FROM webhook_events
            WHERE webhook_id = $1
            """,
            webhook_id
        )
        
        # Delete webhook
        await execute(
            """
            DELETE FROM webhooks
            WHERE id = $1
            """,
            webhook_id
        )
        
        return {"message": "Webhook deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting webhook: {str(e)}")


@router.get("/{webhook_id}/events", response_model=List[WebhookEventResponse])
async def get_webhook_events(
    webhook_id: str,
    current_user: TokenData = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get webhook events for a specific webhook."""
    try:
        # Verify ownership
        webhook = await fetchrow(
            """
            SELECT id FROM webhooks
            WHERE id = $1 AND user_id = $2
            """,
            webhook_id,
            current_user.user_id
        )
        
        if not webhook:
            raise HTTPException(status_code=404, detail="Webhook not found")
        
        events = await fetch(
            """
            SELECT id, webhook_id, event_type, payload, status, created_at, last_attempt_at, next_retry_at, retry_count
            FROM webhook_events
            WHERE webhook_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            """,
            webhook_id,
            limit,
            offset
        )
        
        return [
            WebhookEventResponse(
                id=e["id"],
                webhook_id=e["webhook_id"],
                event_type=e["event_type"],
                payload=e["payload"],
                status=e["status"],
                created_at=e["created_at"],
                last_attempt_at=e["last_attempt_at"],
                next_retry_at=e["next_retry_at"],
                retry_count=e["retry_count"]
            )
            for e in events
        ]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching webhook events: {str(e)}")


@router.get("/{webhook_id}/stats")
async def get_webhook_stats_endpoint(
    current_user: TokenData = Depends(get_current_user)
):
    """Get statistics for user's webhooks."""
    try:
        stats = await get_webhook_stats(current_user.user_id)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")


@router.post("/retry-process")
async def trigger_retry_processing(
    current_user: TokenData = Depends(get_current_user)
):
    """Manually trigger webhook retry processing (admin endpoint)."""
    try:
        processed = await process_pending_retries()
        return {"processed_retries": processed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing retries: {str(e)}")
