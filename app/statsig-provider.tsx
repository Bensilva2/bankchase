"use client";

import React from "react";
import { LogLevel, StatsigProvider, useClientAsyncInit } from "@statsig/react-bindings";
import { StatsigAutoCapturePlugin } from "@statsig/web-analytics";
import { StatsigSessionReplayPlugin } from "@statsig/session-replay";

export default function StatsigWrapper({ children }: { children: React.ReactNode }) {
  // Initialize Statsig client with plugins
  const { client, isLoading } = useClientAsyncInit(
    process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY!,
    {
      userID: typeof window !== "undefined" ? 
        (sessionStorage.getItem("statsig_user_id") || (() => {
          const id = `user-${Math.random().toString(36).substr(2, 9)}`;
          sessionStorage.setItem("statsig_user_id", id);
          return id;
        })()) : 
        "user-server",
      // Optional: Add more user properties for segmentation
      // email: 'user@example.com',
      // customIDs: { accountID: 'account-123' },
      // custom: { plan: 'premium', country: 'US' }
    },
    {
      logLevel: LogLevel.Info,
      disableAutoCapture: false,
      plugins: [
        new StatsigAutoCapturePlugin(),
        new StatsigSessionReplayPlugin(),
      ],
    }
  );

  if (isLoading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <StatsigProvider client={client}>
      {children}
    </StatsigProvider>
  );
}
