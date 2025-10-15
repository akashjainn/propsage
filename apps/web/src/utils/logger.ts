type Level = "debug" | "info" | "warn" | "error";
const isProd = process.env.NODE_ENV === "production";

function log(level: Level, msg: string, meta?: any) {
  // Simple console-based logger; swap with Sentry later if needed.
  const payload = meta ? `${msg} ${JSON.stringify(meta)}` : msg;
  // Avoid noisy logs in prod except warn/error
  if (isProd && (level === "debug" || level === "info")) return;
  // eslint-disable-next-line no-console
  console[level]?.(payload);
}

export const logger = {
  debug: (m: string, meta?: any) => log("debug", m, meta),
  info: (m: string, meta?: any) => log("info", m, meta),
  warn: (m: string, meta?: any) => log("warn", m, meta),
  error: (m: string, meta?: any) => log("error", m, meta),
};
