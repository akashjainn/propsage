import http from "http";
import { createApp } from "./app.js";

// ---- Fatal guards ----
function onFatal(err: unknown) {
  console.error("\uD83D\uDCA5 Fatal error — exiting:", err);
  process.exit(1);
}
process.on("uncaughtException", onFatal);
process.on("unhandledRejection", onFatal);

// ---- Create Express app with all routes ----
const app = createApp();

// ---- Bind address/port ----
// Use platform-provided PORT if available. Bind to 0.0.0.0 so PaaS (Railway, Render) can route traffic.
// You can override HOST via env if needed for local quirks, but default should be 0.0.0.0 in containers.
const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

const server = http.createServer(app);

server.on("error", (err: any) => {
  console.error("Server error:", err);
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} in use.`);
  }
  process.exit(1);
});

server.listen(port, host, () => {
  console.log(`✅ PropSage API is listening on ${host}:${port}`);
  console.log(`   Health: /health`);
  console.log(`   NFL Routes: /nfl/sd/teams`);
});
