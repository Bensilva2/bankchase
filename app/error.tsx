"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[v0] Global error caught:", error.message);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-destructive/10 to-background px-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="flex justify-center">
              <div className="bg-destructive/20 p-4 rounded-full">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-foreground">Something went wrong</h1>
              <p className="text-muted-foreground mt-2">
                We apologize for the inconvenience. An unexpected error occurred.
              </p>
            </div>

            {error.digest && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground font-mono">
                  Error ID: {error.digest}
                </p>
              </div>
            )}

            {process.env.NODE_ENV === "development" && (
              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg text-left">
                <p className="text-xs text-red-600 dark:text-red-200 font-mono break-words">
                  {error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => reset()}
                className="flex-1"
                variant="default"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={() => router.push("/")}
                className="flex-1"
                variant="outline"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
