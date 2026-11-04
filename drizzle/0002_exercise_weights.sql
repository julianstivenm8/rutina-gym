CREATE TABLE "exercise_track" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name_key" text NOT NULL,
	"initial_name" text NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_track_owner_unique" UNIQUE("id","user_id"),
	CONSTRAINT "exercise_track_name_unique" UNIQUE("user_id","name_key"),
	CONSTRAINT "exercise_track_version_check" CHECK ("exercise_track"."version" >= 0)
);
--> statement-breakpoint
CREATE TABLE "exercise_weight" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"exercise_id" text NOT NULL,
	"request_id" text NOT NULL,
	"amount" numeric(7, 3) NOT NULL,
	"unit" text NOT NULL,
	"version" integer NOT NULL,
	"routine_id" text NOT NULL,
	"routine_name" text NOT NULL,
	"exercise_name" text NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_weight_request_unique" UNIQUE("user_id","request_id"),
	CONSTRAINT "exercise_weight_version_unique" UNIQUE("exercise_id","user_id","version"),
	CONSTRAINT "exercise_weight_amount_check" CHECK ("exercise_weight"."amount" >= 0 AND "exercise_weight"."amount" <= 9999.999),
	CONSTRAINT "exercise_weight_unit_check" CHECK ("exercise_weight"."unit" IN ('kg', 'lb')),
	CONSTRAINT "exercise_weight_version_check" CHECK ("exercise_weight"."version" > 0)
);
--> statement-breakpoint
ALTER TABLE "exercise_track" ADD CONSTRAINT "exercise_track_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_weight" ADD CONSTRAINT "exercise_weight_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_weight" ADD CONSTRAINT "exercise_weight_owner_fk" FOREIGN KEY ("exercise_id","user_id") REFERENCES "public"."exercise_track"("id","user_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- Link existing exercises without changing their names, notes or order.
INSERT INTO exercise_track (id, user_id, name_key, initial_name)
SELECT DISTINCT ON (p.user_id, lower(regexp_replace(btrim(e.value->>'name'), '[[:space:]]+', ' ', 'g')))
  gen_random_uuid()::text, p.user_id,
  lower(regexp_replace(btrim(e.value->>'name'), '[[:space:]]+', ' ', 'g')), e.value->>'name'
FROM routine_plan p
CROSS JOIN LATERAL jsonb_array_elements(p.definition->'weeks') WITH ORDINALITY w(value, position)
CROSS JOIN LATERAL jsonb_array_elements(w.value->'days') WITH ORDINALITY d(value, position)
CROSS JOIN LATERAL jsonb_array_elements(d.value->'exercises') WITH ORDINALITY e(value, position)
ORDER BY p.user_id, lower(regexp_replace(btrim(e.value->>'name'), '[[:space:]]+', ' ', 'g')), p.id, w.position, d.position, e.position
ON CONFLICT (user_id, name_key) DO NOTHING;
--> statement-breakpoint
UPDATE routine_plan p SET definition = jsonb_set(p.definition, '{weeks}', (
  SELECT jsonb_agg(jsonb_set(w.value, '{days}', (
    SELECT jsonb_agg(jsonb_set(d.value, '{exercises}', coalesce((
      SELECT jsonb_agg(e.value || jsonb_build_object('id', t.id) ORDER BY e.position)
      FROM jsonb_array_elements(d.value->'exercises') WITH ORDINALITY e(value, position)
      JOIN exercise_track t ON t.user_id = p.user_id AND t.name_key = lower(regexp_replace(btrim(e.value->>'name'), '[[:space:]]+', ' ', 'g'))
    ), '[]'::jsonb)) ORDER BY d.position)
    FROM jsonb_array_elements(w.value->'days') WITH ORDINALITY d(value, position)
  )) ORDER BY w.position)
  FROM jsonb_array_elements(p.definition->'weeks') WITH ORDINALITY w(value, position)
));
