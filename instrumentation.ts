import { registerOTel } from '@vercel/otel';

export function register() {
  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME || 'v0-login-password-2',
  });
}
