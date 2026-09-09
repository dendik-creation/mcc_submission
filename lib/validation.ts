import { z } from "zod"

import { CRITERIA_MAX, CRITERIA_MIN } from "@/lib/scoring"

/** MVP does not verify the link is actually reachable/public (that's a P1
 * item, docs/TASKS.md) — only that it's a well-formed, https, Google AI
 * Studio URL. Accessibility problems are flagged manually by a judge. */
export function isValidAiStudioUrl(value: string): boolean {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  return url.protocol === "https:" && url.hostname === "aistudio.google.com"
}

export const submissionUrlSchema = z
  .string()
  .trim()
  .min(1, "URL wajib diisi")
  .refine(
    isValidAiStudioUrl,
    "URL harus tautan Google AI Studio yang publik (https://aistudio.google.com/...)",
  )

export const submissionFormSchema = z.object({
  url: submissionUrlSchema,
  authenticityAck: z.literal(true, {
    error: "Pernyataan keaslian wajib disetujui",
  }),
})

const criteriaScore = z
  .number()
  .int("Nilai harus bilangan bulat")
  .min(CRITERIA_MIN, `Nilai minimal ${CRITERIA_MIN}`)
  .max(CRITERIA_MAX, `Nilai maksimal ${CRITERIA_MAX}`)

export const scoreFormSchema = z.object({
  participantId: z.uuid(),
  theme: criteriaScore,
  design: criteriaScore,
  functionality: criteriaScore,
  creativity: criteriaScore,
  aiUsage: criteriaScore,
  notes: z.string().trim().max(2000).optional(),
  status: z.enum(["draft", "final"]),
})

export const participantFormSchema = z.object({
  participantNumber: z.string().trim().min(1, "Nomor peserta wajib diisi"),
  fullName: z.string().trim().min(1, "Nama wajib diisi"),
  nim: z.string().trim().min(1, "NIM wajib diisi"),
  contact: z.string().trim().optional(),
  password: z.string().min(6, "Password minimal 6 karakter"),
})

export const participantLoginSchema = z.object({
  participantNumber: z.string().trim().min(1, "Nomor peserta wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
})

export const judgeLoginSchema = z.object({
  email: z.email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
})
