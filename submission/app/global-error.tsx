"use client"

// Catches errors thrown by the root layout itself (fonts/theme setup) —
// regular error.tsx can't reach that far up. Must render its own <html>/
// <body> since the root layout is what failed.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100svh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "1.5rem",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.125rem", fontWeight: 500 }}>Terjadi kesalahan</h1>
            <p style={{ color: "#666", marginTop: "0.25rem", fontSize: "0.875rem" }}>
              Aplikasi gagal dimuat. Coba muat ulang halaman.
            </p>
          </div>
          <button
            onClick={reset}
            style={{
              borderRadius: "9999px",
              padding: "0.5rem 1rem",
              background: "#111",
              color: "#fff",
              fontSize: "0.875rem",
            }}
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  )
}
