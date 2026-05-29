'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, TrendingUp, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export function PlaidAnalyticsDashboard() {
  const [funnelData, setFunnelData] = useState<any>(null);
  const [usageData, setUsageData] = useState<any>(null);
  const [errorData, setErrorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('Not authenticated');

        // Fetch funnel data
        const funnelResponse = await fetch('/api/plaid/analytics?type=funnel', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (funnelResponse.ok) {
          setFunnelData(await funnelResponse.json());
        }

        // Fetch usage data
        const usageResponse = await fetch('/api/plaid/analytics?type=usage&days=30', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (usageResponse.ok) {
          setUsageData(await usageResponse.json());
        }

        // Fetch error data
        const errorResponse = await fetch('/api/plaid/analytics?type=errors', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (errorResponse.ok) {
          setErrorData(await errorResponse.json());
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 border border-red-200">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <span className="text-red-700">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Plaid Link Analytics</h2>
        <p className="text-muted-foreground">Monitor your Plaid integration performance and health</p>
      </div>

      <Tabs defaultValue="funnel" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="usage">API Usage</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        {/* Conversion Funnel Tab */}
        <TabsContent value="funnel" className="space-y-4">
          {funnelData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Initiated</p>
                  <p className="text-3xl font-bold">{funnelData.initiated}</p>
                  <p className="text-xs text-muted-foreground mt-2">Link sessions</p>
                </div>
              </Card>

              <Card className="p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Completed</p>
                  <p className="text-3xl font-bold text-green-600">{funnelData.completed}</p>
                  <p className="text-xs text-muted-foreground mt-2">Successful links</p>
                </div>
              </Card>

              <Card className="p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Completion Rate</p>
                  <p className="text-3xl font-bold">{funnelData.completion_rate}%</p>
                  <p className="text-xs text-muted-foreground mt-2">Success rate</p>
                </div>
              </Card>

              <Card className="p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Error Rate</p>
                  <p className="text-3xl font-bold text-red-600">{funnelData.error_rate}%</p>
                  <p className="text-xs text-muted-foreground mt-2">Failed sessions</p>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* API Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          {usageData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Requests</p>
                    <p className="text-2xl font-bold">{usageData.total_requests}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Errors</p>
                    <p className="text-2xl font-bold text-red-600">{usageData.total_errors}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Error Rate</p>
                    <p className="text-2xl font-bold">{usageData.error_rate}%</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Response</p>
                    <p className="text-2xl font-bold">{usageData.avg_response_time_ms}ms</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-4">
          {errorData && Array.isArray(errorData) && errorData.length > 0 ? (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Top Errors</h3>
              <div className="space-y-3">
                {errorData.map((error: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-mono text-sm">{error.error_code}</p>
                      <p className="text-xs text-muted-foreground">Error code</p>
                    </div>
                    <Badge variant="outline">
                      {error.count} occurrence{error.count !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <p className="text-muted-foreground">No errors recorded</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
