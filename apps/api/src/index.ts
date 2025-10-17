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
  console.log(`✅ PropSage API is alive at http://${host}:${port}`);
  console.log(`   Health: http://${host}:${port}/health`);
  console.log(`   NFL Routes: http://${host}:${port}/nfl/sd/teams`);
});
