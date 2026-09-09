import { describe, expect, it } from "vitest"

import { isValidAiStudioUrl } from "./validation"

describe("isValidAiStudioUrl", () => {
  it("accepts a well-formed https aistudio.google.com URL", () => {
    expect(isValidAiStudioUrl("https://aistudio.google.com/apps/drive/abc123")).toBe(true)
  })

  it("rejects non-https URLs", () => {
    expect(isValidAiStudioUrl("http://aistudio.google.com/apps/drive/abc123")).toBe(false)
  })

  it("rejects other hosts", () => {
    expect(isValidAiStudioUrl("https://example.com/apps/drive/abc123")).toBe(false)
    expect(isValidAiStudioUrl("https://evil.com/?redirect=aistudio.google.com")).toBe(false)
  })

  it("rejects malformed input", () => {
    expect(isValidAiStudioUrl("not a url")).toBe(false)
    expect(isValidAiStudioUrl("")).toBe(false)
  })
})
