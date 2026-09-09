import "./load-env.ts"

import { createServer } from "node:http"
import next from "next"

// Relative (not "@/...") imports below: this file runs directly under
// Node/Bun before Next's bundler is involved, so tsconfig path aliases
// aren't resolved here — only inside app/**, components/**, and other
// Next-bundled code.
import { attachWebSocketServer } from "./lib/realtime/ws-server.ts"

const port = Number.parseInt(process.env.PORT ?? "3000", 10)
const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res)
  })

  attachWebSocketServer(server)

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port} (${dev ? "development" : "production"})`)
  })
})
