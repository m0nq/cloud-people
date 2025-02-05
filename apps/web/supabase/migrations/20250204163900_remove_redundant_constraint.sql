BEGIN;

-- First, find and drop any foreign key constraints that reference the unique constraint
ALTER TABLE "public"."Edges" DROP CONSTRAINT IF EXISTS "edges_from_node_id_fkey";
ALTER TABLE "public"."Edges" DROP CONSTRAINT IF EXISTS "edges_to_node_id_fkey";

-- Then drop the redundant unique constraint
ALTER TABLE "public"."Nodes" DROP CONSTRAINT IF EXISTS "Nodes_id_key";
DROP INDEX IF EXISTS "public"."Nodes_id_key";

-- Recreate the foreign key constraints to reference the primary key instead
ALTER TABLE "public"."Edges" 
    ADD CONSTRAINT "edges_from_node_id_fkey" 
    FOREIGN KEY (from_node_id) 
    REFERENCES "Nodes"(id) 
    ON DELETE CASCADE;

ALTER TABLE "public"."Edges" 
    ADD CONSTRAINT "edges_to_node_id_fkey" 
    FOREIGN KEY (to_node_id) 
    REFERENCES "Nodes"(id) 
    ON DELETE CASCADE;

COMMIT;
