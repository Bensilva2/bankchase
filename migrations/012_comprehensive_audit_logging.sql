-- Comprehensive Audit Logging System
-- Tracks all data access and modifications

BEGIN;

-- ============================================
-- AUDIT LOG TABLES
-- ============================================

-- Main audit log for all operations
CREATE TABLE IF NOT EXISTS public.audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    operation VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT
);

-- Data access log
CREATE TABLE IF NOT EXISTS public.data_access_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL,
    columns_accessed TEXT[],
    record_ids UUID[],
    access_type VARCHAR(50) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(255)
);

-- Sensitive data access log
CREATE TABLE IF NOT EXISTS public.sensitive_data_access (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    data_type VARCHAR(100) NOT NULL,
    record_id UUID,
    accessed_by UUID NOT NULL REFERENCES public.users(id),
    access_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    access_reason VARCHAR(255),
    ip_address INET,
    approved BOOLEAN DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_operation ON public.audit_log(operation, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON public.audit_log(table_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON public.audit_log(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_access_log_user ON public.data_access_log(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_access_log_table ON public.data_access_log(table_name, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_sensitive_access_timestamp ON public.sensitive_data_access(access_timestamp DESC);

-- Enable RLS on audit tables (only admins/auditors can view)
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensitive_data_access ENABLE ROW LEVEL SECURITY;

-- Policies for audit logs
CREATE POLICY "audit_logs_admin_read" ON public.audit_log
    FOR SELECT
    USING (auth.jwt() ->> 'role' IN ('admin', 'auditor', 'compliance'));

CREATE POLICY "audit_logs_insert" ON public.audit_log
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "access_logs_admin_read" ON public.data_access_log
    FOR SELECT
    USING (auth.jwt() ->> 'role' IN ('admin', 'auditor', 'compliance'));

CREATE POLICY "sensitive_access_admin_read" ON public.sensitive_data_access
    FOR SELECT
    USING (auth.jwt() ->> 'role' IN ('admin', 'auditor', 'compliance'));

-- ============================================
-- AUDIT TRIGGER FUNCTIONS
-- ============================================

-- Function to record audit logs
CREATE OR REPLACE FUNCTION record_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_log (
        user_id,
        operation,
        table_name,
        record_id,
        old_values,
        new_values,
        timestamp
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        CASE WHEN TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
        CURRENT_TIMESTAMP
    );
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record data access
CREATE OR REPLACE FUNCTION record_data_access(
    p_table_name VARCHAR,
    p_columns_accessed TEXT[],
    p_record_ids UUID[],
    p_reason VARCHAR DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.data_access_log (
        user_id,
        table_name,
        columns_accessed,
        record_ids,
        access_type,
        timestamp,
        reason
    ) VALUES (
        auth.uid(),
        p_table_name,
        p_columns_accessed,
        p_record_ids,
        'SELECT',
        CURRENT_TIMESTAMP,
        p_reason
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record sensitive data access
CREATE OR REPLACE FUNCTION record_sensitive_access(
    p_data_type VARCHAR,
    p_record_id UUID,
    p_reason VARCHAR DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.sensitive_data_access (
        user_id,
        data_type,
        record_id,
        accessed_by,
        access_reason,
        access_timestamp
    ) VALUES (
        auth.uid(),
        p_data_type,
        p_record_id,
        auth.uid(),
        p_reason,
        CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AUDIT TRIGGERS ON MAIN TABLES
-- ============================================

-- Users table audit trigger
CREATE TRIGGER users_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION record_audit_log();

-- Accounts table audit trigger
CREATE TRIGGER accounts_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.accounts
FOR EACH ROW
EXECUTE FUNCTION record_audit_log();

-- Transfers table audit trigger
CREATE TRIGGER transfers_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.transfers
FOR EACH ROW
EXECUTE FUNCTION record_audit_log();

-- Transactions table audit trigger (if exists)
CREATE TRIGGER transactions_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION record_audit_log();

-- ============================================
-- AUDIT CLEANUP FUNCTIONS
-- ============================================

-- Function to clean old audit logs (older than specified days)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.audit_log
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user activity summary
CREATE OR REPLACE FUNCTION get_user_activity(p_user_id UUID, days INTEGER DEFAULT 30)
RETURNS TABLE (
    operation VARCHAR,
    table_name VARCHAR,
    count INTEGER,
    last_activity TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        audit_log.operation,
        audit_log.table_name,
        COUNT(*)::INTEGER,
        MAX(audit_log.timestamp)
    FROM public.audit_log
    WHERE audit_log.user_id = p_user_id
        AND audit_log.timestamp > CURRENT_TIMESTAMP - INTERVAL '1 day' * days
    GROUP BY audit_log.operation, audit_log.table_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get all operations on a record
CREATE OR REPLACE FUNCTION get_record_history(p_table_name VARCHAR, p_record_id UUID)
RETURNS TABLE (
    operation VARCHAR,
    user_id UUID,
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        audit_log.operation,
        audit_log.user_id,
        audit_log.old_values,
        audit_log.new_values,
        audit_log.timestamp
    FROM public.audit_log
    WHERE audit_log.table_name = p_table_name
        AND audit_log.record_id = p_record_id
    ORDER BY audit_log.timestamp DESC;
END;
$$ LANGUAGE plpgsql;

COMMIT;
