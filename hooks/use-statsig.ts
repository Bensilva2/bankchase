"use client";

import { useStatsigClient } from "@statsig/react-bindings";

/**
 * Hook to use Statsig features in client components
 * Provides access to feature gates, dynamic configs, and experiment variants
 */
export function useStatsig() {
  const { client } = useStatsigClient();

  return {
    // Log custom events
    logEvent: (eventName: string, value?: string | number, metadata?: Record<string, any>) => {
      try {
        client.logEvent(eventName, value, metadata);
      } catch (error) {
        console.error("[v0] Error logging Statsig event:", error);
      }
    },

    // Check if a feature gate is enabled
    checkFeatureGate: (gateName: string): boolean => {
      try {
        return client.checkFeatureGate(gateName);
      } catch (error) {
        console.error("[v0] Error checking Statsig feature gate:", error);
        return false;
      }
    },

    // Get dynamic config for a user
    getDynamicConfig: (configName: string) => {
      try {
        return client.getDynamicConfig(configName);
      } catch (error) {
        console.error("[v0] Error getting Statsig dynamic config:", error);
        return null;
      }
    },

    // Get experiment variant
    getExperiment: (experimentName: string) => {
      try {
        return client.getExperiment(experimentName);
      } catch (error) {
        console.error("[v0] Error getting Statsig experiment:", error);
        return null;
      }
    },

    // Get the underlying Statsig client
    client,
  };
}
