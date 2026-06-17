-- Real-Time Alert System for Suspicious Activities
-- Detects and logs potential security issues

BEGIN;

-- ============================================
-- ALERT CONFIGURATION TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.alert_configurations (
    id BIGSERIAL PRIMARY KEY,
    alert_type VARCHAR(100) UNIQUE NOT NULL,
    threshold_value NUMERIC,
    threshold_unit VARCHAR(50),
    enabled BOOLEAN DEFAULT TRUE,
    notification_channels TEXT[] DEFAULT ARRAY['email', 'in_app'],
    severity VARCHAR(20) DEFAULT 'medium',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- ALERTS LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.alerts (
    id BIGSERIAL PRIMARY KEY,
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    user_id UUID REFERENCES public.users(id),
    affected_record_id UUID,
    message TEXT NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_alerts_type ON public.alerts(alert_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON public.alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON public.alerts(resolved, created_at DESC);

-- Enable RLS
ALTER TABLE public.alert_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Only admins can manage alert configurations
CREATE POLICY "alert_config_admin_only" ON public.alert_configurations
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- Only admins/auditors can view alerts
CREATE POLICY "alerts_admin_read" ON public.alerts
    FOR SELECT
    USING (auth.jwt() ->> 'role' IN ('admin', 'auditor', 'compliance'));

-- ============================================
-- DEFAULT ALERT CONFIGURATIONS
-- ============================================

INSERT INTO public.alert_configurations (alert_type, threshold_value, threshold_unit, severity, description)
VALUES
    ('large_transfer', 5000, 'USD', 'medium', 'Transfer amount exceeds $5000'),
    ('failed_login', 5, 'attempts_15min', 'high', '5+ failed login attempts in 15 minutes'),
    ('unusual_access_time', NULL, NULL, 'low', 'Access outside normal business hours'),
    ('bulk_data_access', 100, 'records', 'high', 'Accessing more than 100 records at once'),
    ('sensitive_data_access', 1, 'access', 'medium', 'Access to SSN, card numbers, or other PII'),
    ('unusual_location', NULL, NULL, 'medium', 'Login from unusual geographic location'),
    ('concurrent_login', 3, 'sessions', 'medium', 'More than 3 concurrent sessions'),
    ('data_deletion', 1, 'records', 'high', 'Deletion of user data'),
    ('failed_transfer', 10, 'attempts_hour', 'medium', '10+ failed transfer attempts in an hour'),
    ('account_status_change', NULL, NULL, 'medium', 'Account status changed')
ON CONFLICT (alert_type) DO NOTHING;

-- ============================================
-- ALERT TRIGGER FUNCTIONS
-- ============================================

-- Function to create and send alerts
CREATE OR REPLACE FUNCTION create_alert(
    p_alert_type VARCHAR,
    p_user_id UUID,
    p_message TEXT,
    p_details JSONB DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    v_alert_id BIGINT;
    v_severity VARCHAR;
    v_config RECORD;
BEGIN
    -- Get alert configuration
    SELECT * INTO v_config
    FROM public.alert_configurations
    WHERE alert_type = p_alert_type AND enabled = TRUE;
    
    IF v_config IS NULL THEN
        RETURN NULL;
    END IF;
    
    v_severity := v_config.severity;
    
    -- Create alert record
    INSERT INTO public.alerts (
        alert_type,
        severity,
        user_id,
        message,
        details,
        created_at
    ) VALUES (
        p_alert_type,
        v_severity,
        p_user_id,
        p_message,
        p_details,
        CURRENT_TIMESTAMP
    )
    RETURNING alerts.id INTO v_alert_id;
    
    -- TODO: Send notifications via QStash
    -- This will be integrated with the backend
    
    RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for large transfers
CREATE OR REPLACE FUNCTION check_large_transfer(
    p_from_user_id UUID,
    p_amount NUMERIC
)
RETURNS void AS $$
DECLARE
    v_threshold NUMERIC;
BEGIN
    SELECT threshold_value INTO v_threshold
    FROM public.alert_configurations
    WHERE alert_type = 'large_transfer';
    
    IF p_amount > v_threshold THEN
        PERFORM create_alert(
            'large_transfer',
            p_from_user_id,
            'Transfer amount of $' || p_amount || ' exceeds threshold of $' || v_threshold,
            jsonb_build_object('amount', p_amount, 'threshold', v_threshold)
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log login attempt
CREATE OR REPLACE FUNCTION log_login_attempt(
    p_user_id UUID,
    p_success BOOLEAN,
    p_ip_address INET DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_failed_count INTEGER;
BEGIN
    -- Check failed login attempts in last 15 minutes
    IF NOT p_success THEN
        SELECT COUNT(*) INTO v_failed_count
        FROM public.login_history
        WHERE user_id = p_user_id
            AND success = FALSE
            AND created_at > CURRENT_TIMESTAMP - INTERVAL '15 minutes';
        
        -- Alert if 5+ failed attempts
        IF v_failed_count >= 5 THEN
            PERFORM create_alert(
                'failed_login',
                p_user_id,
                'Multiple failed login attempts detected (' || v_failed_count || ' attempts)',
                jsonb_build_object('attempt_count', v_failed_count, 'ip_address', p_ip_address::TEXT)
            );
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect bulk data access
CREATE OR REPLACE FUNCTION check_bulk_access(
    p_user_id UUID,
    p_table_name VARCHAR,
    p_record_count INTEGER
)
RETURNS void AS $$
DECLARE
    v_threshold INTEGER;
BEGIN
    SELECT (threshold_value::INTEGER) INTO v_threshold
    FROM public.alert_configurations
    WHERE alert_type = 'bulk_data_access';
    
    IF p_record_count > v_threshold THEN
        PERFORM create_alert(
            'bulk_data_access',
            p_user_id,
            'Bulk data access detected: ' || p_record_count || ' records accessed from ' || p_table_name,
            jsonb_build_object('table', p_table_name, 'record_count', p_record_count, 'threshold', v_threshold)
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to alert on unusual access times
CREATE OR REPLACE FUNCTION check_unusual_access_time(p_user_id UUID)
RETURNS void AS $$
DECLARE
    v_hour INTEGER;
BEGIN
    v_hour := EXTRACT(HOUR FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
    
    -- Alert if access outside business hours (9 AM - 5 PM UTC)
    IF v_hour < 9 OR v_hour >= 17 THEN
        PERFORM create_alert(
            'unusual_access_time',
            p_user_id,
            'Access detected outside normal business hours (UTC: ' || v_hour || ':00)',
            jsonb_build_object('hour', v_hour, 'timestamp', CURRENT_TIMESTAMP)
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to alert on sensitive data access
CREATE OR REPLACE FUNCTION check_sensitive_access(
    p_user_id UUID,
    p_data_type VARCHAR
)
RETURNS void AS $$
BEGIN
    -- Check if this is a sensitive data type that requires alerting
    IF p_data_type IN ('ssn', 'card_number', 'cvv', 'bank_account') THEN
        PERFORM create_alert(
            'sensitive_data_access',
            p_user_id,
            'Sensitive data accessed: ' || p_data_type,
            jsonb_build_object('data_type', p_data_type, 'timestamp', CURRENT_TIMESTAMP)
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS FOR TRANSFERS
-- ============================================

CREATE OR REPLACE FUNCTION transfer_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Check for large transfers
        PERFORM check_large_transfer(NEW.from_user_id, NEW.amount);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on transfers table
CREATE TRIGGER transfers_alert_trigger
AFTER INSERT ON public.transfers
FOR EACH ROW
EXECUTE FUNCTION transfer_audit_trigger();

-- ============================================
-- ALERT MANAGEMENT FUNCTIONS
-- ============================================

-- Function to resolve an alert
CREATE OR REPLACE FUNCTION resolve_alert(p_alert_id BIGINT, p_resolution_notes TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
    UPDATE public.alerts
    SET
        resolved = TRUE,
        resolved_at = CURRENT_TIMESTAMP,
        resolved_by = auth.uid(),
        details = CASE
            WHEN details IS NULL THEN jsonb_build_object('resolution_notes', p_resolution_notes)
            ELSE details || jsonb_build_object('resolution_notes', p_resolution_notes)
        END
    WHERE id = p_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unresolved alerts
CREATE OR REPLACE FUNCTION get_unresolved_alerts(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
    id BIGINT,
    alert_type VARCHAR,
    severity VARCHAR,
    user_id UUID,
    message TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        alerts.id,
        alerts.alert_type,
        alerts.severity,
        alerts.user_id,
        alerts.message,
        alerts.created_at
    FROM public.alerts
    WHERE resolved = FALSE
    ORDER BY alerts.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get alerts by severity
CREATE OR REPLACE FUNCTION get_alerts_by_severity(p_severity VARCHAR, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    id BIGINT,
    alert_type VARCHAR,
    message TEXT,
    user_id UUID,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        alerts.id,
        alerts.alert_type,
        alerts.message,
        alerts.user_id,
        alerts.created_at
    FROM public.alerts
    WHERE severity = p_severity
    ORDER BY alerts.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMIT;
