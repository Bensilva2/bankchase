"""
Webhook event handling and triggering logic
"""
import json
import uuid
import hmac
import hashlib
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import httpx
import logging

from database import execute, fetchrow, fetch

logger = logging.getLogger(__name__)


async def trigger_webhook_event(
    user_id: str,
    event_type: str,
    payload: Dict[str, Any],
    db_pool=None
) -> Optional[str]:
    """
    Trigger a webhook event for all active webhooks subscribed to this event type.
    
    Args:
        user_id: The user who owns the webhook
        event_type: Type of event (e.g., "transfer.completed")
        payload: Event payload data
        db_pool: Optional database pool (uses default if not provided)
    
    Returns:
        Event ID or None if no webhooks found
    """
    try:
        # Get all active webhooks for this user subscribed to this event
        webhooks = await fetch(
            """
            SELECT id, url, secret, events
            FROM webhooks
            WHERE user_id = $1 AND is_active = true
            AND $2 = ANY(events)
            """,
            user_id,
            event_type
        )
        
        if not webhooks:
            logger.info(f"No active webhooks found for user {user_id} and event {event_type}")
            return None
        
        # Create webhook event record
        event_id = str(uuid.uuid4())
        await execute(
            """
            INSERT INTO webhook_events (id, webhook_id, event_type, payload, status)
            VALUES ($1, $2, $3, $4, $5)
            """,
            event_id,
            webhooks[0]["id"],  # Use first webhook for now, iterate for multiple
            event_type,
            json.dumps(payload),
            "pending"
        )
        
        # For each webhook, attempt to send
        for webhook in webhooks:
            await _send_webhook_request(
                webhook_id=webhook["id"],
                webhook_url=webhook["url"],
                webhook_secret=webhook["secret"],
                event_type=event_type,
                payload=payload,
                event_id=event_id
            )
        
        return event_id
    
    except Exception as e:
        logger.error(f"Error triggering webhook event: {e}")
        return None


async def _send_webhook_request(
    webhook_id: str,
    webhook_url: str,
    webhook_secret: str,
    event_type: str,
    payload: Dict[str, Any],
    event_id: str,
    attempt: int = 1
) -> bool:
    """
    Send a webhook request with HMAC signature.
    
    Args:
        webhook_id: ID of the webhook
        webhook_url: URL to send the webhook to
        webhook_secret: Secret for HMAC signing
        event_type: Type of event
        payload: Event payload
        event_id: ID of the webhook event
        attempt: Attempt number
    
    Returns:
        True if successful, False otherwise
    """
    try:
        # Create HMAC signature
        payload_json = json.dumps(payload)
        signature = hmac.new(
            webhook_secret.encode(),
            payload_json.encode(),
            hashlib.sha256
        ).hexdigest()
        
        headers = {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Event": event_type,
            "X-Webhook-ID": webhook_id,
            "User-Agent": "BankChase-Webhooks/1.0"
        }
        
        # Send request with timeout
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                webhook_url,
                content=payload_json,
                headers=headers
            )
        
        # Update event status
        if response.status_code >= 200 and response.status_code < 300:
            await execute(
                """
                UPDATE webhook_events
                SET status = 'delivered', last_attempt_at = NOW()
                WHERE id = $1
                """,
                event_id
            )
            logger.info(f"Webhook {webhook_id} delivered successfully")
            return True
        else:
            # Schedule retry
            await _schedule_retry(webhook_id, event_id, attempt, response.status_code)
            return False
    
    except httpx.TimeoutException:
        logger.warning(f"Webhook {webhook_id} request timeout on attempt {attempt}")
        await _schedule_retry(webhook_id, event_id, attempt, "timeout")
        return False
    
    except Exception as e:
        logger.error(f"Error sending webhook to {webhook_url}: {e}")
        await _schedule_retry(webhook_id, event_id, attempt, str(e))
        return False


async def _schedule_retry(
    webhook_id: str,
    event_id: str,
    current_attempt: int,
    error_info: str
):
    """
    Schedule a retry for a failed webhook with exponential backoff.
    
    Args:
        webhook_id: ID of the webhook
        event_id: ID of the webhook event
        current_attempt: Current attempt number
        error_info: Error information
    """
    max_attempts = 5
    
    if current_attempt >= max_attempts:
        # Mark as failed
        await execute(
            """
            UPDATE webhook_events
            SET status = 'failed', last_attempt_at = NOW()
            WHERE id = $1
            """,
            event_id
        )
        logger.error(f"Webhook {webhook_id} failed after {max_attempts} attempts")
        return
    
    # Calculate backoff: 2^attempt minutes (1, 2, 4, 8, 16 minutes)
    backoff_minutes = 2 ** current_attempt
    
    # Create retry record
    retry_id = str(uuid.uuid4())
    await execute(
        """
        INSERT INTO webhook_retries (id, event_id, webhook_id, attempt_number, error_info, next_retry_at, status)
        VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '1 minute' * $6, 'pending')
        """,
        retry_id,
        event_id,
        webhook_id,
        current_attempt + 1,
        error_info,
        backoff_minutes
    )
    
    # Update event with next retry time
    await execute(
        """
        UPDATE webhook_events
        SET status = 'retry_scheduled', next_retry_at = NOW() + INTERVAL '1 minute' * $2
        WHERE id = $1
        """,
        event_id,
        backoff_minutes
    )
    
    logger.info(f"Scheduled retry for webhook {webhook_id} in {backoff_minutes} minutes (attempt {current_attempt + 1}/{max_attempts})")
