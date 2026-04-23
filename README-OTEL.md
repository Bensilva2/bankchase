# OpenTelemetry Setup with Kubiks

This project is configured to send telemetry data to Kubiks for observability.

## Configuration

To enable telemetry, add the following environment variables to your `.env.local` file:

```env
OTEL_EXPORTER_OTLP_ENDPOINT=https://ingest.kubiks.app
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
OTEL_EXPORTER_OTLP_HEADERS=x-kubiks-key=YOUR_KUBIKS_API_KEY
OTEL_SERVICE_NAME=v0-login-password-2
```

Replace `YOUR_KUBIKS_API_KEY` with your actual Kubiks API key.

## How It Works

- **instrumentation.ts** - Automatically registers OpenTelemetry when the Next.js application starts
- **@vercel/otel** - Provides automatic instrumentation for Next.js applications
- **Kubiks** - Receives and stores your telemetry data at `ingest.kubiks.app`

## Data Collected

The instrumentation automatically collects:
- HTTP request traces (routes, status codes, duration)
- Database queries
- External API calls
- Performance metrics
- Errors and exceptions

## Verifying It Works

Once configured:
1. Deploy your application with the environment variables set
2. Make some requests to your application
3. Visit your Kubiks dashboard to see the collected traces and logs

For more information, visit https://docs.kubiks.ai
