"use client";

import React, { useState, useEffect } from "react";
import { StatsigProvider } from "@statsig/react-bindings";

export default function StatsigWrapper({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Initialize Statsig on client side only
    const initStatsig = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY) {
          console.warn("[v0] Statsig client key not found, skipping initialization");
          setInitialized(true);
          return;
        }

        // Get or create user ID
        const userId = typeof window !== "undefined" ? 
          (sessionStorage.getItem("statsig_user_id") || (() => {
            const id = `user-${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem("statsig_user_id", id);
            return id;
          })()) : 
          "user-server";

        console.log("[v0] Statsig initialized with user:", userId);
        setInitialized(true);
      } catch (err) {
        console.error("[v0] Statsig initialization error:", err);
        setError(err instanceof Error ? err : new Error("Failed to initialize Statsig"));
        setInitialized(true);
      }
    };

    initStatsig();
  }, []);

  if (!initialized) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    console.error("[v0] Statsig error:", error);
    // Still render children even if Statsig fails
    return <>{children}</>;
  }

  // Render without Statsig provider if key is not available
  if (!process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
