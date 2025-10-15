

import express from "express";
import http from "http";

const app = express();

// ---- Health route only ----
app.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    demo: process.env.DEMO_MODE === "true",
  });
});

// ---- Fatal guards ----
function onFatal(err: unknown) {
  console.error("\uD83D\uDCA5 Fatal error — exiting:", err);
  process.exit(1);
}
process.on("uncaughtException", onFatal);
process.on("unhandledRejection", onFatal);

// ---- Bind explicitly on Windows ----
const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "127.0.0.1";

const server = http.createServer(app);

server.on("error", (err: any) => {
  console.error("Server error:", err);
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} in use.`);
  }
  process.exit(1);
});

server.listen(port, host, () => {
  console.log(`✅ Minimal API is alive at http://${host}:${port}/health`);
});
