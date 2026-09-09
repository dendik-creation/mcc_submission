import { relations } from "drizzle-orm"
import {
  bigint,
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core"

export const userRole = pgEnum("user_role", ["participant", "judge"])
export const userStatus = pgEnum("user_status", ["active", "disabled"])
export const registrationStatus = pgEnum("registration_status", [
  "registered",
  "disabled",
])
export const competitionState = pgEnum("competition_state", [
  "not_started",
  "running",
  "paused",
  "closed",
])
export const submissionStatus = pgEnum("submission_status", [
  "received",
  "received_late",
  "needs_fix",
  "inaccessible",
])
export const scoreStatus = pgEnum("score_status", ["draft", "final"])

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  role: userRole("role").notNull(),
  // Participant login = nomor peserta, judge login = email.
  loginIdentifier: text("login_identifier").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  status: userStatus("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const participants = pgTable("participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  participantNumber: text("participant_number").notNull().unique(),
  fullName: text("full_name").notNull(),
  nim: text("nim").notNull().unique(),
  contact: text("contact"),
  registrationStatus: registrationStatus("registration_status")
    .notNull()
    .default("registered"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const competitions = pgTable("competitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  scheduledStartAt: timestamp("scheduled_start_at", { withTimezone: true }),
  scheduledEndAt: timestamp("scheduled_end_at", { withTimezone: true }),
  state: competitionState("state").notNull().default("not_started"),
  // Live deadline, shifts on pause/resume. Null until the competition starts.
  endsAt: timestamp("ends_at", { withTimezone: true }),
  // Snapshot of remaining ms, captured when paused, consumed on resume.
  remainingMsSnapshot: bigint("remaining_ms_snapshot", { mode: "number" }),
  // Minutes-remaining thresholds (in seconds) that trigger a big projector dialog.
  timerThresholdSeconds: integer("timer_threshold_seconds")
    .array()
    .notNull()
    .default([3600, 1800, 600, 300]),
  projectorToken: text("projector_token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  participantId: uuid("participant_id")
    .notNull()
    .unique()
    .references(() => participants.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  status: submissionStatus("status").notNull().default("received"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull(),
  isOnTime: boolean("is_on_time").notNull(),
  authenticityAck: boolean("authenticity_ack").notNull().default(false),
  // Set by a judge/admin to grant exactly one post-deadline update; consumed
  // (cleared) the next time this participant successfully submits
  // (docs/02: "Juri/Admin membuka ulang submission dan alasan dicatat").
  reopenedAt: timestamp("reopened_at", { withTimezone: true }),
  reopenReason: text("reopen_reason"),
  reopenedBy: uuid("reopened_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const submissionRevisions = pgTable("submission_revisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id")
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  oldUrl: text("old_url"),
  newUrl: text("new_url").notNull(),
  changedBy: uuid("changed_by")
    .notNull()
    .references(() => users.id),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const scores = pgTable(
  "scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    judgeId: uuid("judge_id")
      .notNull()
      .references(() => users.id),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    criteriaTheme: integer("criteria_theme").notNull(),
    criteriaDesign: integer("criteria_design").notNull(),
    criteriaFunctionality: integer("criteria_functionality").notNull(),
    criteriaCreativity: integer("criteria_creativity").notNull(),
    criteriaAiUsage: integer("criteria_ai_usage").notNull(),
    weightedTotal: numeric("weighted_total", {
      precision: 5,
      scale: 2,
    }).notNull(),
    notes: text("notes"),
    status: scoreStatus("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("scores_judge_participant_unique").on(
      table.judgeId,
      table.participantId,
    ),
  ],
)

export const resultSnapshots = pgTable("result_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  lockedAt: timestamp("locked_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lockedBy: uuid("locked_by")
    .notNull()
    .references(() => users.id),
  // Null on the first lock; required whenever a later lock supersedes one.
  reason: text("reason"),
  rankings: jsonb("rankings").notNull(),
  winners: jsonb("winners").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const sessions = pgTable("sessions", {
  // Primary key is the SHA-256 hash of the opaque session token — the raw
  // token only ever lives in the httpOnly cookie, never at rest.
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const usersRelations = relations(users, ({ one, many }) => ({
  participant: one(participants, {
    fields: [users.id],
    references: [participants.userId],
  }),
  sessions: many(sessions),
}))

export const participantsRelations = relations(participants, ({ one }) => ({
  user: one(users, {
    fields: [participants.userId],
    references: [users.id],
  }),
  submission: one(submissions, {
    fields: [participants.id],
    references: [submissions.participantId],
  }),
}))

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  participant: one(participants, {
    fields: [submissions.participantId],
    references: [participants.id],
  }),
  revisions: many(submissionRevisions),
}))

export const submissionRevisionsRelations = relations(
  submissionRevisions,
  ({ one }) => ({
    submission: one(submissions, {
      fields: [submissionRevisions.submissionId],
      references: [submissions.id],
    }),
    changedByUser: one(users, {
      fields: [submissionRevisions.changedBy],
      references: [users.id],
    }),
  }),
)

export const scoresRelations = relations(scores, ({ one }) => ({
  judge: one(users, {
    fields: [scores.judgeId],
    references: [users.id],
  }),
  participant: one(participants, {
    fields: [scores.participantId],
    references: [participants.id],
  }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))
