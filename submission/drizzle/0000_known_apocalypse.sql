CREATE TYPE "public"."competition_state" AS ENUM('not_started', 'running', 'paused', 'closed');--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('registered', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."score_status" AS ENUM('draft', 'final');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('received', 'received_late', 'needs_fix', 'inaccessible');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('participant', 'judge');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"scheduled_start_at" timestamp with time zone,
	"scheduled_end_at" timestamp with time zone,
	"state" "competition_state" DEFAULT 'not_started' NOT NULL,
	"ends_at" timestamp with time zone,
	"remaining_ms_snapshot" bigint,
	"timer_threshold_seconds" integer[] DEFAULT '{3600,1800,600,300}' NOT NULL,
	"projector_token" text NOT NULL,
	"late_submission_allowed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "competitions_projector_token_unique" UNIQUE("projector_token")
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"participant_number" text NOT NULL,
	"full_name" text NOT NULL,
	"nim" text NOT NULL,
	"contact" text,
	"registration_status" "registration_status" DEFAULT 'registered' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "participants_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "participants_participant_number_unique" UNIQUE("participant_number"),
	CONSTRAINT "participants_nim_unique" UNIQUE("nim")
);
--> statement-breakpoint
CREATE TABLE "result_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"locked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_by" uuid NOT NULL,
	"reason" text,
	"rankings" jsonb NOT NULL,
	"winners" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"judge_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"criteria_theme" integer NOT NULL,
	"criteria_design" integer NOT NULL,
	"criteria_functionality" integer NOT NULL,
	"criteria_creativity" integer NOT NULL,
	"criteria_ai_usage" integer NOT NULL,
	"weighted_total" numeric(5, 2) NOT NULL,
	"notes" text,
	"status" "score_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"old_url" text,
	"new_url" text NOT NULL,
	"changed_by" uuid NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"url" text NOT NULL,
	"status" "submission_status" DEFAULT 'received' NOT NULL,
	"submitted_at" timestamp with time zone NOT NULL,
	"is_on_time" boolean NOT NULL,
	"authenticity_ack" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submissions_participant_id_unique" UNIQUE("participant_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" "user_role" NOT NULL,
	"login_identifier" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_login_identifier_unique" UNIQUE("login_identifier")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "result_snapshots" ADD CONSTRAINT "result_snapshots_locked_by_users_id_fk" FOREIGN KEY ("locked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_judge_id_users_id_fk" FOREIGN KEY ("judge_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_revisions" ADD CONSTRAINT "submission_revisions_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_revisions" ADD CONSTRAINT "submission_revisions_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "scores_judge_participant_unique" ON "scores" USING btree ("judge_id","participant_id");