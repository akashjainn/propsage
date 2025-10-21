// Install required web API polyfills before anything else loads.
import "./polyfills.js";
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

// ---- Bind address/port with auto-retry in dev ----
// Use platform-provided PORT if available. Bind to 0.0.0.0 so PaaS (Railway, Render) can route traffic.
// If PORT is not explicitly set and the port is busy, we auto-increment and retry a few times for local dev.
const host = process.env.HOST ?? "0.0.0.0";
const explicitPort = typeof process.env.PORT !== 'undefined' && process.env.PORT !== ''
const BASE_PORT = Number(process.env.PORT ?? 4000)
const MAX_ATTEMPTS = explicitPort ? 1 : 10

function startServer(tryPort: number, attempt: number) {
  const srv = http.createServer(app)

  srv.on("error", (err: any) => {
    if (err?.code === "EADDRINUSE") {
      if (attempt < MAX_ATTEMPTS) {
        const next = tryPort + 1
        console.warn(`Port ${tryPort} in use, retrying on ${next} (attempt ${attempt + 1}/${MAX_ATTEMPTS})`)
        // Small delay to avoid tight loop
        setTimeout(() => startServer(next, attempt + 1), 150)
        return
      }
      console.error(`Port ${tryPort} in use and no retries left${explicitPort ? ' (PORT explicitly set)' : ''}.`)
    } else {
      console.error("Server error:", err)
    }
    process.exit(1)
  })

  srv.listen(tryPort, host, () => {
    // Record the actual port
    process.env.PORT = String(tryPort)
    console.log(`✅ PropSage API is listening on ${host}:${tryPort}`)
    console.log(`   Health: /health`)
    console.log(`   NFL Routes: /nfl/sd/teams`)
  })
}

startServer(BASE_PORT, 1)
