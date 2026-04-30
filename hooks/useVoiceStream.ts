import { useState, useCallback, useRef, useEffect } from 'react';
import ApiClient from '@/lib/api-client';

export interface SecurityResult {
  type: string;
  overall_risk: number;
  recommendation: 'PROCEED' | 'STEP_UP' | 'ESCALATE';
  drift_detected: boolean;
  action: string;
  timestamp?: string;
}

export interface VoiceStreamState {
  isConnected: boolean;
  isRecording: boolean;
  error: string | null;
  securityResult: SecurityResult | null;
}

export function useVoiceStream(userId: string, orgId: string, token: string) {
  const [state, setState] = useState<VoiceStreamState>({
    isConnected: false,
    isRecording: false,
    error: null,
    securityResult: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const connect = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Setup Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // Connect WebSocket
      const ws = ApiClient.connectVoiceStream(userId, orgId, token);

      ws.onopen = () => {
        console.log('[v0] Voice WebSocket connected');
        setState((prev) => ({ ...prev, isConnected: true, error: null }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'security_result') {
          setState((prev) => ({ ...prev, securityResult: data }));
        }
      };

      ws.onerror = (error) => {
        console.error('[v0] WebSocket error:', error);
        setState((prev) => ({
          ...prev,
          error: 'Voice connection error',
          isConnected: false,
        }));
      };

      ws.onclose = () => {
        console.log('[v0] Voice WebSocket closed');
        setState((prev) => ({ ...prev, isConnected: false, isRecording: false }));
      };

      wsRef.current = ws;

      // Setup audio processing
      processor.onaudioprocess = (event) => {
        const audioData = event.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(audioData.length);

        for (let i = 0; i < audioData.length; i++) {
          const s = Math.max(-1, Math.min(1, audioData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Send audio chunk to WebSocket
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              event: 'media',
              media: {
                payload: Buffer.from(pcm16).toString('base64'),
              },
            })
          );
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setState((prev) => ({ ...prev, isRecording: true }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect to microphone';
      console.error('[v0] Voice stream error:', message);
      setState((prev) => ({ ...prev, error: message }));
    }
  }, [userId, orgId, token]);

  const disconnect = useCallback(() => {
    // Stop audio
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
    }

    setState((prev) => ({
      ...prev,
      isConnected: false,
      isRecording: false,
      securityResult: null,
    }));
  }, []);

  const sendFeatures = useCallback(
    (features: Record<string, number>) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            user_id: userId,
            org_id: orgId,
            behavioral_features: features,
            session_confidence: 0.85,
          })
        );
      }
    },
    [userId, orgId]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    state,
    connect,
    disconnect,
    sendFeatures,
    isReady: !!token && !!userId && !!orgId,
  };
}
