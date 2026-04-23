"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] Global error caught:", error)
  }, [error])

  return (
    <html>
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#fff" }}>
          <div style={{ maxWidth: 400, textAlign: "center" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ color: "#666", fontSize: 14, marginBottom: 4 }}>{error.message}</p>
            <pre style={{ fontSize: 11, textAlign: "left", background: "#f5f5f5", padding: 12, borderRadius: 8, overflow: "auto", maxHeight: 200, color: "#555", marginBottom: 16 }}>
              {error.stack}
            </pre>
            <button
              onClick={() => reset()}
              style={{ padding: "10px 24px", background: "#0a4fa6", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
