/**
 * Concurrent-load smoke test for the realtime/read paths (docs/TASKS.md
 * Milestone 6 — "load test submission simultan").
 *
 * IMPORTANT scope note: this does NOT drive the actual submit-URL flow,
 * because that flow is a React Server Action, and Server Actions are
 * invoked through an internal, version-specific wire protocol (not a
 * plain REST endpoint) that isn't meant to be replicated from a script —
 * only from a real browser. Use a browser-based tool (e.g. Playwright) if
 * you need to load-test the submission POST path itself.
 *
 * What this DOES exercise, at whatever concurrency you give it: repeated
 * GET /api/health (representative of judge/admin dashboard polling and
 * fallback refresh), and N concurrent WebSocket connections held open
 * (representative of judges + the projector board watching realtime
 * during a submission burst).
 *
 * Usage:
 *   node scripts/load-test.ts --url http://localhost:3000 --count 100 --concurrency 20 --sockets 20
 *   node scripts/load-test.ts --sockets 50 --token <competition.projectorToken>   # test accepted WS path
 */
import { WebSocket } from "ws"

type Args = {
  url: string
  count: number
  concurrency: number
  sockets: number
  token?: string
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  const get = (flag: string, fallback: string) => {
    const idx = args.indexOf(flag)
    return idx === -1 ? fallback : args[idx + 1]
  }
  const has = (flag: string) => args.includes(flag)
  return {
    url: get("--url", "http://localhost:3000"),
    count: Number(get("--count", "100")),
    concurrency: Number(get("--concurrency", "20")),
    sockets: Number(get("--sockets", "20")),
    token: has("--token") ? get("--token", "") : undefined,
  }
}

async function timedFetch(url: string) {
  const start = performance.now()
  const res = await fetch(url)
  const ms = performance.now() - start
  return { ok: res.ok, status: res.status, ms }
}

async function runHttpBurst({ url, count, concurrency }: Args) {
  const target = `${url}/api/health`
  const results: { ok: boolean; status: number; ms: number }[] = []
  let inFlight = 0
  let started = 0

  await new Promise<void>((resolve) => {
    function launchNext() {
      if (started >= count) {
        if (inFlight === 0) resolve()
        return
      }
      started += 1
      inFlight += 1
      timedFetch(target)
        .then((r) => results.push(r))
        .catch(() => results.push({ ok: false, status: 0, ms: 0 }))
        .finally(() => {
          inFlight -= 1
          launchNext()
        })
    }
    for (let i = 0; i < Math.min(concurrency, count); i += 1) launchNext()
  })

  const durations = results.map((r) => r.ms).sort((a, b) => a - b)
  const p = (pct: number) => durations[Math.floor((durations.length - 1) * pct)] ?? 0
  const failed = results.filter((r) => !r.ok).length

  console.log(`\nHTTP burst: ${count} requests @ concurrency ${concurrency}`)
  console.log(`  failed: ${failed}/${count}`)
  console.log(`  p50=${p(0.5).toFixed(1)}ms p95=${p(0.95).toFixed(1)}ms p99=${p(0.99).toFixed(1)}ms max=${durations.at(-1)?.toFixed(1)}ms`)
}

async function runSocketHold({ url, sockets, token }: Args) {
  const wsUrl = url.replace(/^http/, "ws") + "/ws" + (token ? `?token=${encodeURIComponent(token)}` : "")
  let opened = 0
  let failed = 0

  const connections = await Promise.all(
    Array.from({ length: sockets }, () =>
      new Promise<WebSocket | null>((resolve) => {
        // Without --token, connections are expected to be rejected (401) —
        // that's still a useful check that the gateway holds up under
        // concurrent rejected handshakes. Pass a real projector token to
        // test the accepted path at scale instead.
        const ws = new WebSocket(wsUrl)
        const timer = setTimeout(() => {
          ws.terminate()
          resolve(null)
        }, 5000)
        ws.on("open", () => {
          clearTimeout(timer)
          opened += 1
          resolve(ws)
        })
        ws.on("unexpected-response", () => {
          clearTimeout(timer)
          failed += 1
          resolve(null)
        })
        ws.on("error", () => {
          clearTimeout(timer)
          failed += 1
          resolve(null)
        })
      }),
    ),
  )

  console.log(`\nWebSocket hold: ${sockets} attempted`)
  console.log(`  opened: ${opened}, rejected/failed: ${failed}`)
  console.log(`  (rejections are expected without --token/a real session — see script header)`)

  for (const ws of connections) ws?.close()
}

async function main() {
  const args = parseArgs()
  console.log(`Load test against ${args.url}`)
  await runHttpBurst(args)
  await runSocketHold(args)
}

main().catch((error) => {
  console.error("[load-test] failed:", error)
  process.exit(1)
})
