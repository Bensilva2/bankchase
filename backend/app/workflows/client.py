"""
Workflow Client
Interfaces with Vercel Workflow SDK via HTTP API
"""

import os
import json
import httpx
from typing import Any, Optional, Dict
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class WorkflowClient:
    """Client for triggering and managing workflows via Vercel Workflow API"""
    
    def __init__(self):
        self.endpoint = os.getenv("WORKFLOW_ENDPOINT", "http://localhost:3000/api/workflows")
        self.api_key = os.getenv("WORKFLOW_API_KEY", "dev-key")
        self.timeout = 30.0
        
    async def start_workflow(
        self,
        workflow_type: str,
        user_id: str,
        org_id: str,
        payload: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Start a new workflow execution
        
        Args:
            workflow_type: Type of workflow (transfer, loan_application, etc)
            user_id: User initiating the workflow
            org_id: Organization context
            payload: Input data for the workflow
            metadata: Optional metadata
            
        Returns:
            Workflow run details including run_id
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        body = {
            "workflow_type": workflow_type,
            "user_id": user_id,
            "org_id": org_id,
            "payload": payload,
            "metadata": metadata or {},
            "started_at": datetime.utcnow().isoformat()
        }
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.endpoint}",
                    json=body,
                    headers=headers
                )
                response.raise_for_status()
                result = response.json()
                logger.info(f"Started {workflow_type} workflow: {result.get('run_id')}")
                return result
            except httpx.HTTPError as e:
                logger.error(f"Failed to start workflow: {str(e)}")
                raise
    
    async def get_workflow_status(self, run_id: str) -> Dict[str, Any]:
        """Get status of a workflow run"""
        headers = {"Authorization": f"Bearer {self.api_key}"}
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.endpoint}/{run_id}",
                    headers=headers
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"Failed to get workflow status: {str(e)}")
                raise
    
    async def resume_hook(
        self,
        hook_token: str,
        payload: Dict[str, Any]
    ) -> None:
        """Resume a paused workflow via hook"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        body = {
            "token": hook_token,
            "payload": payload
        }
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.endpoint}/hooks",
                    json=body,
                    headers=headers
                )
                response.raise_for_status()
                logger.info(f"Resumed hook: {hook_token}")
            except httpx.HTTPError as e:
                logger.error(f"Failed to resume hook: {str(e)}")
                raise
    
    async def handle_webhook(
        self,
        hook_token: str,
        request_data: Dict[str, Any]
    ) -> None:
        """Handle incoming webhook callback"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        body = {
            "token": hook_token,
            "data": request_data
        }
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.endpoint}/webhooks",
                    json=body,
                    headers=headers
                )
                response.raise_for_status()
                logger.info(f"Processed webhook for hook: {hook_token}")
            except httpx.HTTPError as e:
                logger.error(f"Failed to handle webhook: {str(e)}")
                raise


# Global client instance
_workflow_client: Optional[WorkflowClient] = None

def get_workflow_client() -> WorkflowClient:
    """Get or create workflow client"""
    global _workflow_client
    if _workflow_client is None:
        _workflow_client = WorkflowClient()
    return _workflow_client
