'use client';

import { useState, useEffect } from 'react';
import { useVoiceStream } from '@/hooks/useVoiceStream';
import { useSession } from 'next-auth/react';
import {
  Mic,
  MicOff,
  AlertCircle,
  CheckCircle,
  Shield,
  TrendingUp,
  Volume2,
} from 'lucide-react';

export default function VoiceAgentPage() {
  const { data: session } = useSession();
  const [isInitialized, setIsInitialized] = useState(false);

  const userId = session?.user?.id || '';
  const orgId = session?.user?.org_id || '';
  const token = session?.accessToken || '';

  const {
    state: voiceState,
    connect,
    disconnect,
    sendFeatures,
    isReady,
  } = useVoiceStream(userId, orgId, token);

  useEffect(() => {
    if (isReady) {
      setIsInitialized(true);
    }
  }, [isReady]);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('[v0] Failed to connect voice:', error);
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'PROCEED':
        return 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300';
      case 'STEP_UP':
        return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300';
      case 'ESCALATE':
        return 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-300';
    }
  };

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case 'PROCEED':
        return <CheckCircle className="w-5 h-5" />;
      case 'STEP_UP':
        return <AlertCircle className="w-5 h-5" />;
      case 'ESCALATE':
        return <Shield className="w-5 h-5" />;
      default:
        return null;
    }
  };

  if (!isInitialized) {
    return (
      <main className="min-h-screen bg-background pb-24 md:pb-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          </div>
          <p className="text-muted-foreground">Initializing voice agent...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Voice Agent</h1>
          <p className="text-muted-foreground">
            Real-time voice banking with advanced security
          </p>
        </div>

        {/* Main Control Card */}
        <div className="bg-card border border-border rounded-2xl p-8 mb-8">
          <div className="flex flex-col items-center gap-6">
            {/* Large Mic Button */}
            <button
              onClick={voiceState.isRecording ? disconnect : handleConnect}
              disabled={!isReady}
              className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                voiceState.isRecording
                  ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50'
                  : 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {voiceState.isRecording ? (
                <MicOff className="w-16 h-16 text-white" />
              ) : (
                <Mic className="w-16 h-16 text-white" />
              )}

              {/* Pulse Animation */}
              {voiceState.isRecording && (
                <>
                  <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-pulse"></div>
                  <div className="absolute inset-4 rounded-full border-2 border-red-500 animate-pulse" style={{
                    animationDelay: '0.2s',
                  }}></div>
                </>
              )}
            </button>

            {/* Status Text */}
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">
                {voiceState.isRecording ? 'Listening...' : 'Ready to Listen'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {voiceState.isConnected
                  ? 'Connection established'
                  : 'Click mic to start voice session'}
              </p>
            </div>

            {/* Error Display */}
            {voiceState.error && (
              <div className="w-full bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg p-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <span className="font-semibold">Error:</span> {voiceState.error}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Security Result Card */}
        {voiceState.securityResult && (
          <div className="bg-card border border-border rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Security Analysis
            </h2>

            <div className="space-y-6">
              {/* Recommendation */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Recommendation
                </p>
                <div
                  className={`flex items-center gap-3 w-fit px-4 py-3 rounded-lg font-semibold ${getRecommendationColor(
                    voiceState.securityResult.recommendation
                  )}`}
                >
                  {getRecommendationIcon(voiceState.securityResult.recommendation)}
                  {voiceState.securityResult.recommendation}
                </div>
              </div>

              {/* Risk Level */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Overall Risk Score
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-background rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          voiceState.securityResult.overall_risk < 0.33
                            ? 'bg-green-500'
                            : voiceState.securityResult.overall_risk < 0.66
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{
                          width: `${voiceState.securityResult.overall_risk * 100}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {(voiceState.securityResult.overall_risk * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Drift Detection
                  </p>
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    {voiceState.securityResult.drift_detected ? (
                      <>
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        Anomaly Detected
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Normal Pattern
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <span className="font-semibold">Action:</span>{' '}
                  {voiceState.securityResult.action === 'proceed'
                    ? 'Proceeding with transaction'
                    : 'Additional verification required'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Live Metrics */}
        {voiceState.isRecording && (
          <div className="bg-card border border-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Live Audio Metrics
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Volume', value: '78 dB', icon: Volume2 },
                { label: 'Pitch', value: '185 Hz', icon: TrendingUp },
                { label: 'Clarity', value: '92%', icon: CheckCircle },
                { label: 'Latency', value: '45 ms', icon: AlertCircle },
              ].map((metric, i) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={i}
                    className="bg-background border border-border rounded-lg p-4 flex flex-col items-center gap-2"
                  >
                    <Icon className="w-5 h-5 text-primary" />
                    <p className="text-xs text-muted-foreground text-center">{metric.label}</p>
                    <p className="text-lg font-bold text-foreground">{metric.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
