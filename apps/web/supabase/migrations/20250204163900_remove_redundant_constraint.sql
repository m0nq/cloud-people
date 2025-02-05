BEGIN;

-- Remove redundant unique constraint since id is already a primary key
ALTER TABLE "public"."Nodes" DROP CONSTRAINT IF EXISTS "Nodes_id_key";
DROP INDEX IF EXISTS "public"."Nodes_id_key";

COMMIT;
