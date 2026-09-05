ALTER TABLE "contexts" ADD COLUMN "slide_index" integer;
--> statement-breakpoint
UPDATE "contexts" SET "slide_index" = sub.rn
FROM (
	SELECT "id", (ROW_NUMBER() OVER (PARTITION BY "user_id" ORDER BY "created_at") - 1) % 8 AS rn
	FROM "contexts"
) AS sub
WHERE "contexts"."id" = sub."id";
--> statement-breakpoint
ALTER TABLE "contexts" ALTER COLUMN "slide_index" SET NOT NULL;
