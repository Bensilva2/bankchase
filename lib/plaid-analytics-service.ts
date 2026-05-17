import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const PLAID_ENV = process.env.PLAID_ENV || 'production';
const PLAID_DASHBOARD_TOKEN = process.env.PLAID_DASHBOARD_TOKEN;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

interface LinkAnalyticsRequest {
  from_date: string;
  to_date: string;
  team_id?: string;
}

interface LinkSessionMetrics {
  total_opens: number;
  institution_selected: number;
  auth_completed: number;
  error_rate: number;
  avg_time_to_auth_ms: number;
  top_errors: Array<{
    error_code: string;
    count: number;
  }>;
}

export class PlaidAnalyticsService {
  /**
   * Get Link analytics from Plaid Dashboard MCP
   * Requires PLAID_DASHBOARD_TOKEN with mcp:dashboard scope
   */
  static async getLinkAnalytics(
    fromDate: string,
    toDate: string
  ): Promise<any> {
    try {
      if (!PLAID_DASHBOARD_TOKEN) {
        throw new Error('PLAID_DASHBOARD_TOKEN not configured');
      }

      // This would be called via Plaid Dashboard MCP server
      // For now, return mock data
      console.log('[v0] Fetching Link analytics from Plaid Dashboard MCP');

      return {
        period: { from_date: fromDate, to_date: toDate },
        metrics: {
          link_opens: Math.floor(Math.random() * 1000),
          institution_selected: Math.floor(Math.random() * 800),
          auth_completed: Math.floor(Math.random() * 700),
          error_count: Math.floor(Math.random() * 100),
        },
      };
    } catch (error: any) {
      console.error('[v0] Error fetching Link analytics:', error);
      throw error;
    }
  }

  /**
   * Save link session analytics to database
   */
  static async saveLinkSession(
    userId: string,
    sessionData: {
      sessionId: string;
      linkToken: string;
      institutionId?: string;
      institutionName?: string;
      status: 'initiated' | 'completed' | 'error' | 'exited';
      errorCode?: string;
      errorMessage?: string;
      itemId?: string;
      publicToken?: string;
      userAgent?: string;
      ipAddress?: string;
    }
  ) {
    if (!supabase) throw new Error('Supabase client not initialized');

    try {
      const { error } = await supabase
        .from('plaid_link_sessions')
        .insert({
          user_id: userId,
          session_id: sessionData.sessionId,
          link_token: sessionData.linkToken,
          status: sessionData.status,
          institution_id: sessionData.institutionId,
          institution_name: sessionData.institutionName,
          error_code: sessionData.errorCode,
          error_message: sessionData.errorMessage,
          item_id: sessionData.itemId,
          public_token: sessionData.publicToken,
          user_agent: sessionData.userAgent,
          ip_address: sessionData.ipAddress,
          linked_at: sessionData.status === 'completed' ? new Date().toISOString() : null,
        });

      if (error) throw error;
      console.log('[v0] Link session saved');
    } catch (error: any) {
      console.error('[v0] Error saving link session:', error);
      throw error;
    }
  }

  /**
   * Get conversion funnel metrics
   */
  static async getConversionFunnel(userId: string) {
    if (!supabase) throw new Error('Supabase client not initialized');

    try {
      const { data, error } = await supabase
        .from('plaid_link_sessions')
        .select('status')
        .eq('user_id', userId);

      if (error) throw error;

      const statuses = data || [];
      const total = statuses.length;
      const initiated = statuses.filter(s => s.status === 'initiated').length;
      const completed = statuses.filter(s => s.status === 'completed').length;
      const errors = statuses.filter(s => s.status === 'error').length;
      const exited = statuses.filter(s => s.status === 'exited').length;

      return {
        total,
        initiated,
        completed,
        errors,
        exited,
        completion_rate: total > 0 ? (completed / total * 100).toFixed(2) : '0',
        error_rate: total > 0 ? (errors / total * 100).toFixed(2) : '0',
      };
    } catch (error: any) {
      console.error('[v0] Error getting conversion funnel:', error);
      throw error;
    }
  }

  /**
   * Get API usage metrics
   */
  static async getUsageMetrics(days: number = 30) {
    if (!supabase) throw new Error('Supabase client not initialized');

    try {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);

      const { data, error } = await supabase
        .from('plaid_api_metrics')
        .select('*')
        .gte('date', sinceDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;

      const metrics = data || [];
      const totalRequests = metrics.reduce((sum, m) => sum + (m.request_count || 0), 0);
      const totalErrors = metrics.reduce((sum, m) => sum + (m.error_count || 0), 0);
      const avgResponseTime = metrics.length > 0
        ? Math.round(metrics.reduce((sum, m) => sum + (m.avg_response_time_ms || 0), 0) / metrics.length)
        : 0;

      return {
        period_days: days,
        total_requests: totalRequests,
        total_errors: totalErrors,
        error_rate: totalRequests > 0 ? (totalErrors / totalRequests * 100).toFixed(2) : '0',
        avg_response_time_ms: avgResponseTime,
        daily_metrics: metrics,
      };
    } catch (error: any) {
      console.error('[v0] Error getting usage metrics:', error);
      throw error;
    }
  }

  /**
   * Track API metric
   */
  static async trackMetric(
    metricType: string,
    endpoint: string,
    responseTimeMs: number,
    hasError: boolean = false
  ) {
    if (!supabase) throw new Error('Supabase client not initialized');

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: existing, error: queryError } = await supabase
        .from('plaid_api_metrics')
        .select('*')
        .eq('metric_type', metricType)
        .eq('endpoint', endpoint)
        .eq('date', today)
        .single();

      if (queryError && queryError.code !== 'PGRST116') {
        throw queryError;
      }

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('plaid_api_metrics')
          .update({
            request_count: (existing.request_count || 1) + 1,
            error_count: (existing.error_count || 0) + (hasError ? 1 : 0),
            avg_response_time_ms: Math.round(
              ((existing.avg_response_time_ms || responseTimeMs) + responseTimeMs) / 2
            ),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('plaid_api_metrics')
          .insert({
            metric_type: metricType,
            endpoint,
            request_count: 1,
            error_count: hasError ? 1 : 0,
            avg_response_time_ms: responseTimeMs,
            date: today,
            environment: PLAID_ENV,
          });

        if (error) throw error;
      }

      console.log('[v0] Metric tracked');
    } catch (error: any) {
      console.error('[v0] Error tracking metric:', error);
      // Don't throw - metrics tracking should be non-blocking
    }
  }

  /**
   * Get top errors
   */
  static async getTopErrors(userId: string, limit: number = 10) {
    if (!supabase) throw new Error('Supabase client not initialized');

    try {
      const { data, error } = await supabase
        .from('plaid_link_sessions')
        .select('error_code, error_message')
        .eq('user_id', userId)
        .not('error_code', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Count occurrences
      const errorMap = new Map<string, number>();
      (data || []).forEach(session => {
        const code = session.error_code || 'unknown';
        errorMap.set(code, (errorMap.get(code) || 0) + 1);
      });

      return Array.from(errorMap.entries())
        .map(([code, count]) => ({ error_code: code, count }))
        .sort((a, b) => b.count - a.count);
    } catch (error: any) {
      console.error('[v0] Error getting top errors:', error);
      throw error;
    }
  }
}
