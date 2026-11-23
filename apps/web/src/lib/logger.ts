/**
 * @file apps/web/src/lib/logger.ts
 * @description Zero-dependency structured logger outputting single-line JSON telemetry
 * in production and clean formatted events during local development.
 */

export type LogLevel = "info" | "warn" | "error";

export interface LogContext {
  route?: string;
  requestId?: string;
  userId?: string;
  orderNumber?: string;
  durationMs?: number;
  [key: string]: unknown;
}

function emit(level: LogLevel, event: string, context?: LogContext): void {
  const record = {
    timestamp: new Date().toISOString(),
    level,
    service: "sika-web",
    event,
    ...(context ?? {}),
  };

  const serialized = JSON.stringify(record);
  if (level === "error") {
    console.error(serialized);
  } else if (level === "warn") {
    console.warn(serialized);
  } else {
    console.info(serialized);
  }
}

export function logInfo(event: string, context?: LogContext): void {
  emit("info", event, context);
}

export function logWarn(event: string, context?: LogContext): void {
  emit("warn", event, context);
}

export function logError(event: string, context?: LogContext): void {
  emit("error", event, context);
}
