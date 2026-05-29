-- Create webhook_queue table for persistent queue-based webhook delivery
CREATE TABLE IF NOT EXISTS webhook_queue (
    id SERIAL PRIMARY KEY,
    webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    event VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, success, failed
    attempt INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    next_attempt_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_queue_status CHECK (status IN ('pending', 'processing', 'success', 'failed')),
    CONSTRAINT valid_attempt CHECK (attempt >= 0),
    CONSTRAINT valid_max_attempts CHECK (max_attempts > 0)
);

-- Add indexes for efficient queue processing
CREATE INDEX idx_webhook_queue_status_next_attempt ON webhook_queue(status, next_attempt_at) 
    WHERE status = 'pending';
CREATE INDEX idx_webhook_queue_user_id ON webhook_queue(user_id);
CREATE INDEX idx_webhook_queue_webhook_id ON webhook_queue(webhook_id);
CREATE INDEX idx_webhook_queue_created_at ON webhook_queue(created_at DESC);

-- Enable RLS
ALTER TABLE webhook_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhook_queue
CREATE POLICY webhook_queue_user_isolation ON webhook_queue
    USING (user_id = auth.uid());

CREATE POLICY webhook_queue_insert ON webhook_queue
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY webhook_queue_update ON webhook_queue
    FOR UPDATE USING (user_id = auth.uid());
