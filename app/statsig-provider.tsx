"use client";

import React from "react";
import { LogLevel, StatsigProvider } from "@statsig/react-bindings";

export default function StatsigWrapper({ children }: { children: React.ReactNode }) {
  // Generate a unique user ID for analytics
  const getUserID = () => {
    if (typeof window !== "undefined") {
      // Try to get from session storage first
      const stored = sessionStorage.getItem("statsig_user_id");
      if (stored) return stored;
      
      // Generate new ID and store it
      const newID = `user-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("statsig_user_id", newID);
      return newID;
    }
    return "user-server";
  };

  const user = {
    userID: getUserID(),
    // Optional: Add more user properties for segmentation
    // email: 'user@example.com',
    // customIDs: { accountID: 'account-123' },
    // custom: { plan: 'premium', country: 'US' }
  };

  return (
    <StatsigProvider
      sdkKey={process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY!}
      user={user}
      options={{ 
        logLevel: LogLevel.Info,
        disableAutoCapture: false,
      }}
    >
      {children}
    </StatsigProvider>
  );
}
