"""
Webhook Queue Service
Manages webhook deliveries with persistent queue, retries, and exponential backoff
"""
import asyncio
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

import httpx
from database import execute, fetch, fetchrow
from models import WebhookQueueCreate


WEBHOOK_TIMEOUT = 10  # seconds
WEBHOOK_MAX_RETRIES = 5
PROCESSOR_INTERVAL = 30  # seconds
BATCH_SIZE = 50


async def queue_webhook_notification(
    user_id: str,
    event: str,
    payload: Dict[str, Any],
    delay_seconds: int = 0,
    max_attempts: int = WEBHOOK_MAX_RETRIES,
) -> Optional[int]:
    """
    Queue a webhook notification for async delivery.
    
    Args:
        user_id: User ID who owns the webhooks
        event: Event type (e.g., 'transfer.completed', 'balance.updated')
        payload: Event payload data
        delay_seconds: Optional delay before first attempt
        max_attempts: Maximum retry attempts
    
    Returns:
        Queue item ID if successful, None otherwise
    """
    try:
        next_attempt_at = None
        if delay_seconds > 0:
            next_attempt_at = datetime.now(timezone.utc) + timedelta(seconds=delay_seconds)
        
        result = await fetchrow(
            """
            INSERT INTO webhook_queue 
            (webhook_id, user_id, event, payload, attempt, max_attempts, status, next_attempt_at, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING id
            """,
            None,  # webhook_id can be NULL initially, will be populated during processing
            user_id,
            event,
            json.dumps(payload),
            0,
            max_attempts,
            "pending",
            next_attempt_at,
        )
        return result["id"] if result else None
    except Exception as e:
        print(f"[v0] Error queueing webhook: {e}")
        return None


async def _get_webhooks_for_event(user_id: str, event: str) -> list:
    """Get all active webhooks for a user that listen to this event."""
    try:
        webhooks = await fetch(
            """
            SELECT id, url, secret
            FROM webhooks
            WHERE user_id = $1 
            AND is_active = true
            AND events @> $2::jsonb
            """,
            user_id,
            json.dumps([event]),
        )
        return webhooks
    except Exception as e:
        print(f"[v0] Error fetching webhooks: {e}")
        return []


async def _send_webhook(
    webhook_url: str,
    secret: str,
    payload: Dict[str, Any],
) -> bool:
    """
    Send webhook with HMAC-SHA256 signature.
    
    Returns:
        True if successful (2xx response), False otherwise
    """
    try:
        # Generate HMAC signature
        payload_str = json.dumps(payload)
        signature = hmac.new(
            secret.encode(),
            payload_str.encode(),
            hashlib.sha256
        ).hexdigest()
        
        headers = {
            "Content-Type": "application/json",
            "X-Webhook-Signature": f"sha256={signature}",
            "User-Agent": "BankChase/1.0",
        }
        
        async with httpx.AsyncClient(timeout=WEBHOOK_TIMEOUT) as client:
            response = await client.post(webhook_url, json=payload, headers=headers)
            success = response.status_code in (200, 201, 202)
            
            if not success:
                print(f"[v0] Webhook delivery failed: {webhook_url} - {response.status_code}")
            
            return success
    except asyncio.TimeoutError:
        print(f"[v0] Webhook timeout: {webhook_url}")
        return False
    except Exception as e:
        print(f"[v0] Webhook error: {webhook_url} - {e}")
        return False


async def _calculate_next_retry_delay(attempt: int) -> int:
    """Calculate exponential backoff delay in seconds: 2^attempt"""
    return min(2 ** attempt, 3600)  # Cap at 1 hour


async def process_webhook_queue():
    """
    Background processor for webhook queue.
    Runs every PROCESSOR_INTERVAL seconds, processing BATCH_SIZE items.
    """
    print("[v0] Webhook queue processor started")
    
    while True:
        try:
            await asyncio.sleep(PROCESSOR_INTERVAL)
            
            # Get pending items due for delivery
            pending_items = await fetch(
                """
                SELECT id, webhook_id, user_id, event, payload, attempt, max_attempts
                FROM webhook_queue
                WHERE status = 'pending'
                AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
                ORDER BY next_attempt_at ASC
                LIMIT $1
                """,
                BATCH_SIZE,
            )
            
            for item in pending_items:
                await _process_queue_item(item)
                
        except asyncio.CancelledError:
            print("[v0] Webhook queue processor stopped")
            break
        except Exception as e:
            print(f"[v0] Error in webhook processor: {e}")
            await asyncio.sleep(5)  # Brief pause before retry


async def _process_queue_item(item: Dict[str, Any]):
    """Process a single queue item - attempt delivery and update status."""
    try:
        queue_id = item["id"]
        user_id = item["user_id"]
        event = item["event"]
        payload = json.loads(item["payload"]) if isinstance(item["payload"], str) else item["payload"]
        attempt = item["attempt"]
        max_attempts = item["max_attempts"]
        
        # Mark as processing
        await execute(
            "UPDATE webhook_queue SET status = 'processing' WHERE id = $1",
            queue_id
        )
        
        # Get webhooks for this user/event
        webhooks = await _get_webhooks_for_event(user_id, event)
        
        if not webhooks:
            # No webhooks, mark as completed
            await execute(
                "UPDATE webhook_queue SET status = 'failed', attempt = $1 WHERE id = $2",
                attempt + 1,
                queue_id
            )
            return
        
        # Try to deliver to all webhooks
        all_success = True
        for webhook in webhooks:
            success = await _send_webhook(
                webhook["url"],
                webhook["secret"],
                payload
            )
            
            if not success:
                all_success = False
                break
        
        if all_success:
            # Success - mark as delivered
            await execute(
                """
                UPDATE webhook_queue 
                SET status = 'success', attempt = $1, last_attempt_at = NOW()
                WHERE id = $2
                """,
                attempt + 1,
                queue_id
            )
        else:
            # Failed - schedule retry if attempts remain
            new_attempt = attempt + 1
            
            if new_attempt >= max_attempts:
                # Max retries exceeded
                await execute(
                    """
                    UPDATE webhook_queue 
                    SET status = 'failed', attempt = $1, last_attempt_at = NOW()
                    WHERE id = $2
                    """,
                    new_attempt,
                    queue_id
                )
            else:
                # Schedule next retry with exponential backoff
                delay_seconds = await _calculate_next_retry_delay(new_attempt)
                next_attempt_at = datetime.now(timezone.utc) + timedelta(seconds=delay_seconds)
                
                await execute(
                    """
                    UPDATE webhook_queue 
                    SET status = 'pending', attempt = $1, next_attempt_at = $2, last_attempt_at = NOW()
                    WHERE id = $3
                    """,
                    new_attempt,
                    next_attempt_at,
                    queue_id
                )
                
    except Exception as e:
        print(f"[v0] Error processing queue item {item['id']}: {e}")
        # Mark as failed
        await execute(
            "UPDATE webhook_queue SET status = 'failed' WHERE id = $1",
            item["id"]
        )


async def get_webhook_queue_stats(user_id: str) -> Dict[str, Any]:
    """Get queue statistics for a user."""
    try:
        stats = await fetchrow(
            """
            SELECT
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(*) FILTER (WHERE status = 'processing') as processing,
                COUNT(*) FILTER (WHERE status = 'success') as success,
                COUNT(*) FILTER (WHERE status = 'failed') as failed,
                COUNT(*) as total
            FROM webhook_queue
            WHERE user_id = $1
            """,
            user_id
        )
        
        return {
            "pending": stats["pending"] or 0,
            "processing": stats["processing"] or 0,
            "success": stats["success"] or 0,
            "failed": stats["failed"] or 0,
            "total": stats["total"] or 0,
        }
    except Exception as e:
        print(f"[v0] Error getting queue stats: {e}")
        return {"pending": 0, "processing": 0, "success": 0, "failed": 0, "total": 0}
