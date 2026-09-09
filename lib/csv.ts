import { randomBytes } from "node:crypto"
import { parse } from "csv-parse/sync"

export type ParticipantCsvRow = {
  participantNumber: string
  fullName: string
  nim: string
  contact?: string
  password: string
}

const REQUIRED_HEADERS = ["nomor_peserta", "nama", "nim"] as const

/** 8-char alphanumeric, avoids visually ambiguous characters (0/O, 1/l/I) —
 * these get handed out on paper at check-in. */
export function generateTempPassword(): string {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz"
  const bytes = randomBytes(8)
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")
}

export type CsvParseResult = {
  rows: ParticipantCsvRow[]
  errors: { line: number; message: string }[]
}

/** Expected header row: nomor_peserta,nama,nim,kontak,password (kontak and
 * password optional — a missing password is auto-generated). */
export function parseParticipantCsv(content: string): CsvParseResult {
  const records: Record<string, string>[] = parse(content, {
    columns: (header: string[]) => header.map((h) => h.trim().toLowerCase()),
    skip_empty_lines: true,
    trim: true,
  })

  const errors: CsvParseResult["errors"] = []
  const rows: ParticipantCsvRow[] = []

  const headers = records.length > 0 ? Object.keys(records[0]) : []
  const missingHeaders = REQUIRED_HEADERS.filter((h) => !headers.includes(h))
  if (missingHeaders.length > 0) {
    errors.push({
      line: 1,
      message: `Kolom wajib tidak ditemukan: ${missingHeaders.join(", ")}`,
    })
    return { rows, errors }
  }

  records.forEach((record, index) => {
    const line = index + 2 // header is line 1
    const participantNumber = record.nomor_peserta?.trim()
    const fullName = record.nama?.trim()
    const nim = record.nim?.trim()
    if (!participantNumber || !fullName || !nim) {
      errors.push({ line, message: "nomor_peserta, nama, dan nim wajib diisi" })
      return
    }
    rows.push({
      participantNumber,
      fullName,
      nim,
      contact: record.kontak?.trim() || undefined,
      password: record.password?.trim() || generateTempPassword(),
    })
  })

  return { rows, errors }
}
