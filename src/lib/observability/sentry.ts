export function captureError(error: unknown, context?: Record<string, unknown>) {
  console.error("Sentry stub:", { error, context });
}
