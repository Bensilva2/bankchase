export interface Workflow {
  run_id: string
  workflow_type: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  user_id: string
  org_id: string
  input: Record<string, any>
  output?: Record<string, any>
  error_message?: string
  created_at: string
  started_at?: string
  completed_at?: string
}

export interface WorkflowEvent {
  id: string
  run_id: string
  event_type: string
  step_name?: string
  status?: string
  input?: Record<string, any>
  output?: Record<string, any>
  error_message?: string
  duration_ms?: number
  retry_count?: number
  created_at: string
}
