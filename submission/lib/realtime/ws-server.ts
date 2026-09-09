import type { IncomingMessage, Server } from "node:http"
import type { Socket } from "node:net"
import { WebSocket, WebSocketServer } from "ws"

// Relative imports — see the comment in server.ts. Uses session-core.ts
// (not session.ts) specifically because session.ts imports "next/headers",
// which only resolves inside Next's bundler, not this raw bootstrap chain.
import { extractSessionToken, getUserByToken } from "../auth/session-core.ts"
import { getActiveCompetition } from "../db/queries.ts"
import { subscribe, type RealtimeEvent } from "./bus.ts"

type ConnectionRole = "participant" | "judge" | "projector"

/** Who is allowed to receive each event type — mirrors the table in
 * docs/03-realtime-and-timer.md exactly. The projector must never receive
 * `submission_updated` (it carries a participantId). */
function isRecipient(event: RealtimeEvent, role: ConnectionRole): boolean {
  switch (event.type) {
    case "timer_changed":
    case "status_changed":
      return true
    case "submission_received":
      return role === "judge" || role === "projector"
    case "submission_updated":
      return role === "judge"
  }
}

async function resolveRole(
  request: IncomingMessage,
  url: URL,
): Promise<ConnectionRole | null> {
  const projectorToken = url.searchParams.get("token")
  if (projectorToken) {
    const competition = await getActiveCompetition()
    return competition && competition.projectorToken === projectorToken
      ? "projector"
      : null
  }

  const sessionToken = extractSessionToken(request.headers.cookie)
  if (!sessionToken) return null
  const user = await getUserByToken(sessionToken)
  if (!user) return null
  return user.role === "judge" ? "judge" : "participant"
}

export function attachWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ noServer: true })
  const connections = new Set<{ ws: WebSocket; role: ConnectionRole }>()

  server.on("upgrade", (request, socket: Socket, head) => {
    const url = new URL(request.url ?? "/", "http://internal")
    if (url.pathname !== "/ws") {
      socket.destroy()
      return
    }

    resolveRole(request, url)
      .then((role) => {
        if (!role) {
          socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n")
          socket.destroy()
          return
        }
        wss.handleUpgrade(request, socket, head, (ws) => {
          const connection = { ws, role }
          connections.add(connection)
          ws.on("close", () => connections.delete(connection))
          ws.on("error", () => connections.delete(connection))
        })
      })
      .catch(() => socket.destroy())
  })

  subscribe((event) => {
    const payload = JSON.stringify(event)
    for (const { ws, role } of connections) {
      if (ws.readyState !== WebSocket.OPEN) continue
      if (!isRecipient(event, role)) continue
      ws.send(payload)
    }
  })

  return wss
}
