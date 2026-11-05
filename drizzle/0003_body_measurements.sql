CREATE TABLE "body_measurement" (
	"record_id" text NOT NULL,
	"user_id" text NOT NULL,
	"metric" text NOT NULL,
	"amount" numeric(7, 3) NOT NULL,
	CONSTRAINT "body_measurement_record_metric_unique" UNIQUE("record_id","metric"),
	CONSTRAINT "body_measurement_metric_check" CHECK ("body_measurement"."metric" IN ('weightKg', 'heightCm', 'neck', 'shoulders', 'chest', 'waist', 'hips', 'leftArm', 'rightArm', 'leftForearm', 'rightForearm', 'leftThigh', 'rightThigh', 'leftCalf', 'rightCalf')),
	CONSTRAINT "body_measurement_amount_check" CHECK ("body_measurement"."amount" > 0 AND (("body_measurement"."metric" = 'weightKg' AND "body_measurement"."amount" <= 600) OR ("body_measurement"."metric" <> 'weightKg' AND "body_measurement"."amount" <= 300)))
);
--> statement-breakpoint
CREATE TABLE "body_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"gender" text DEFAULT 'unspecified' NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "body_profile_gender_check" CHECK ("body_profile"."gender" IN ('unspecified', 'male', 'female')),
	CONSTRAINT "body_profile_version_check" CHECK ("body_profile"."version" >= 0)
);
--> statement-breakpoint
CREATE TABLE "body_record" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"request_id" text NOT NULL,
	"gender" text NOT NULL,
	"measured_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "body_record_owner_unique" UNIQUE("id","user_id"),
	CONSTRAINT "body_record_request_unique" UNIQUE("user_id","request_id"),
	CONSTRAINT "body_record_gender_check" CHECK ("body_record"."gender" IN ('unspecified', 'male', 'female')),
	CONSTRAINT "body_record_date_check" CHECK ("body_record"."measured_on" >= '1900-01-01'::date)
);
--> statement-breakpoint
ALTER TABLE "body_measurement" ADD CONSTRAINT "body_measurement_owner_fk" FOREIGN KEY ("record_id","user_id") REFERENCES "public"."body_record"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_profile" ADD CONSTRAINT "body_profile_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_record" ADD CONSTRAINT "body_record_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "body_measurement_user_metric_idx" ON "body_measurement" USING btree ("user_id","metric","record_id");--> statement-breakpoint
CREATE INDEX "body_record_user_date_idx" ON "body_record" USING btree ("user_id","measured_on","created_at","id");