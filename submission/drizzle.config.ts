import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.MIGRATIONS_DATABASE_URL ?? process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
})
