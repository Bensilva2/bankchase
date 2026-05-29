"""
Background worker for processing webhook retries
"""
import asyncio
import logging
from datetime import datetime, timezone
import json
from typing import Optional

from database import fetch, execute, fetchrow
from utils.webhook_events import _send_webhook_request

logger = logging.getLogger(__name__)


async def process_pending_retries():
    """
    Process all pending webhook retries that are due.
    
    This function should be called periodically (e.g., every minute)
    to retry failed webhook deliveries with exponential backoff.
    """
    try:
        # Get all pending retries that are due
        pending_retries = await fetch(
            """
            SELECT 
                wr.id,
                wr.event_id,
                wr.webhook_id,
                wr.attempt_number,
                we.event_type,
                we.payload,
                w.url,
                w.secret
            FROM webhook_retries wr
            JOIN webhook_events we ON wr.event_id = we.id
            JOIN webhooks w ON wr.webhook_id = w.id
            WHERE wr.status = 'pending' 
            AND wr.next_retry_at <= NOW()
            ORDER BY wr.next_retry_at ASC
            LIMIT 100
            """
        )
        
        if not pending_retries:
            logger.debug("No pending webhook retries to process")
            return 0
        
        logger.info(f"Processing {len(pending_retries)} pending webhook retries")
        
        processed = 0
        for retry in pending_retries:
            try:
                # Parse payload
                payload = json.loads(retry["payload"]) if isinstance(retry["payload"], str) else retry["payload"]
                
                # Attempt to send
                success = await _send_webhook_request(
                    webhook_id=retry["webhook_id"],
                    webhook_url=retry["url"],
                    webhook_secret=retry["secret"],
                    event_type=retry["event_type"],
                    payload=payload,
                    event_id=retry["event_id"],
                    attempt=retry["attempt_number"]
                )
                
                if success:
                    # Mark retry as completed
                    await execute(
                        """
                        UPDATE webhook_retries
                        SET status = 'completed', completed_at = NOW()
                        WHERE id = $1
                        """,
                        retry["id"]
                    )
                    processed += 1
                else:
                    # The _send_webhook_request already handled scheduling the next retry
                    processed += 1
            
            except Exception as e:
                logger.error(f"Error processing retry {retry['id']}: {e}")
                # Mark as failed to prevent retrying indefinitely
                await execute(
                    """
                    UPDATE webhook_retries
                    SET status = 'failed', error_message = $2
                    WHERE id = $1
                    """,
                    retry["id"],
                    str(e)
                )
                processed += 1
        
        logger.info(f"Processed {processed} webhook retries")
        return processed
    
    except Exception as e:
        logger.error(f"Error in process_pending_retries: {e}")
        return 0


async def get_webhook_stats(user_id: str):
    """
    Get statistics for webhooks and recent events.
    
    Args:
        user_id: The user ID
    
    Returns:
        Dict with webhook statistics
    """
    try:
        stats = await fetchrow(
            """
            SELECT
                (SELECT COUNT(*) FROM webhooks WHERE user_id = $1 AND is_active = true) as active_webhooks,
                (SELECT COUNT(*) FROM webhooks WHERE user_id = $1) as total_webhooks,
                (SELECT COUNT(*) FROM webhook_events WHERE webhook_id IN (
                    SELECT id FROM webhooks WHERE user_id = $1
                ) AND status = 'delivered') as delivered_events,
                (SELECT COUNT(*) FROM webhook_events WHERE webhook_id IN (
                    SELECT id FROM webhooks WHERE user_id = $1
                ) AND status = 'failed') as failed_events,
                (SELECT COUNT(*) FROM webhook_events WHERE webhook_id IN (
                    SELECT id FROM webhooks WHERE user_id = $1
                ) AND status IN ('pending', 'retry_scheduled')) as pending_events
            """,
            user_id
        )
        
        return {
            "active_webhooks": stats["active_webhooks"] or 0,
            "total_webhooks": stats["total_webhooks"] or 0,
            "delivered_events": stats["delivered_events"] or 0,
            "failed_events": stats["failed_events"] or 0,
            "pending_events": stats["pending_events"] or 0
        }
    
    except Exception as e:
        logger.error(f"Error getting webhook stats: {e}")
        return {
            "active_webhooks": 0,
            "total_webhooks": 0,
            "delivered_events": 0,
            "failed_events": 0,
            "pending_events": 0
        }


async def cleanup_old_events(days_to_keep: int = 30):
    """
    Clean up old webhook events and retries.
    
    Args:
        days_to_keep: Number of days of data to retain
    """
    try:
        # Delete old completed retries
        deleted_retries = await execute(
            """
            DELETE FROM webhook_retries
            WHERE completed_at IS NOT NULL
            AND completed_at < NOW() - INTERVAL '1 day' * $1
            """,
            days_to_keep
        )
        
        # Delete old delivered events (keep failed ones longer)
        deleted_events = await execute(
            """
            DELETE FROM webhook_events
            WHERE status = 'delivered'
            AND created_at < NOW() - INTERVAL '1 day' * $1
            """,
            days_to_keep
        )
        
        logger.info(f"Cleanup: deleted {deleted_retries} old retries and {deleted_events} old events")
        return {"retries_deleted": deleted_retries, "events_deleted": deleted_events}
    
    except Exception as e:
        logger.error(f"Error cleaning up old events: {e}")
        return {"retries_deleted": 0, "events_deleted": 0}
