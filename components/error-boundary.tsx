"use client"

import React, { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[v0] ErrorBoundary caught:", error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, fontFamily: "monospace", background: "#fff", minHeight: "100vh" }}>
          <h1 style={{ color: "red", fontSize: 20 }}>Application Error</h1>
          <pre style={{ background: "#f5f5f5", padding: 16, overflow: "auto", fontSize: 13, borderRadius: 8 }}>
            {this.state.error?.message}
            {"\n\n"}
            {this.state.error?.stack}
          </pre>
          <pre style={{ background: "#eee", padding: 16, overflow: "auto", fontSize: 12, borderRadius: 8, marginTop: 10 }}>
            {this.state.errorInfo?.componentStack}
          </pre>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null })
              window.location.reload()
            }}
            style={{ marginTop: 16, padding: "8px 16px", background: "#0a4fa6", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
