ALTER TABLE "submissions" ADD COLUMN "reopened_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "reopen_reason" text;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "reopened_by" uuid;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_reopened_by_users_id_fk" FOREIGN KEY ("reopened_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions" DROP COLUMN "late_submission_allowed";