-- Initialize basic setup
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
select pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_jsonschema" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

COMMENT ON SCHEMA "public" IS 'standard public schema';

-- Drop existing objects if they exist
DROP TABLE IF EXISTS "public"."Edges" CASCADE;
DROP TABLE IF EXISTS "public"."Nodes" CASCADE;
DROP TABLE IF EXISTS "public"."Workflows" CASCADE;
DROP TABLE IF EXISTS "public"."Profiles" CASCADE;
DROP TYPE IF EXISTS "public"."WorkflowState" CASCADE;
DROP FUNCTION IF EXISTS "public"."create_new_profile" CASCADE;

-- Create WorkflowState enum
create type "public"."WorkflowState" as ENUM (
    'Initial',
    'Build',
    'Running',
    'Error',
    'Complete'
);

ALTER type "public"."WorkflowState" OWNER TO "postgres";
COMMENT ON type "public"."WorkflowState" is 'The possible states a workflow can be in';

-- Create tables first
create TABLE IF NOT EXISTS "public"."Profiles" (
                                                   "id" "uuid" NOT NULL,
                                                   "created_at" timestamp with time zone DEFAULT "now"(),
    "email" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "subscription_plan" "text",
    "username" "text",
    "first_name" "text",
    "last_name" "text"
    );

create TABLE IF NOT EXISTS "public"."Workflows" (
                                                    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "state" "public"."WorkflowState" DEFAULT 'Initial'::"public"."WorkflowState" NOT NULL,
    "current_step" "text",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
                               );

create TABLE IF NOT EXISTS "public"."Nodes" (
                                                "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "state" "text",
    "current_step" "text",
    "updated_at" timestamp with time zone
                               );

create TABLE IF NOT EXISTS "public"."Edges" (
                                                "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "to_node_id" "uuid" NOT NULL,
    "from_node_id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone
                               );

-- Create the trigger function after tables exist
create or replace function "public"."create_new_profile"()
RETURNS "trigger"
LANGUAGE "plpgsql"
SECURITY DEFINER
as $$
begin
insert into public."Profiles" (id, email, created_at)
values (NEW.id, NEW.email, NEW.created_at);
return new;
end;
$$;

alter function "public"."create_new_profile"() OWNER TO "postgres";

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_new_profile();


-- Set table ownership
alter table "public"."Profiles" OWNER TO "postgres";
alter table "public"."Workflows" OWNER TO "postgres";
alter table "public"."Nodes" OWNER TO "postgres";
alter table "public"."Edges" OWNER TO "postgres";

-- Add comments
comment on table "public"."Profiles" is 'User data accessible to the app. Not for auth';
comment on table "public"."Workflows" is 'Users list of workflow graphs';
comment on table "public"."Nodes" is 'Nodes of a users workflow';
comment on table "public"."Edges" is 'Edges of the nodes of a users workflow';

-- Add constraints
alter table ONLY "public"."Profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");

alter table ONLY "public"."Workflows"
    ADD CONSTRAINT "workflows_pkey" PRIMARY KEY ("id");

alter table ONLY "public"."Nodes"
    ADD CONSTRAINT "nodes_pkey" PRIMARY KEY ("id");

alter table ONLY "public"."Edges"
    ADD CONSTRAINT "edges_pkey" PRIMARY KEY ("id");

-- Add foreign key constraints
alter table ONLY "public"."Workflows"
    ADD CONSTRAINT "workflows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Profiles"("id");

alter table ONLY "public"."Nodes"
    ADD CONSTRAINT "nodes_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."Workflows"("id") ON delete CASCADE;

alter table ONLY "public"."Edges"
    ADD CONSTRAINT "edges_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."Workflows"("id") ON delete CASCADE;

alter table ONLY "public"."Edges"
    ADD CONSTRAINT "edges_to_node_id_fkey" FOREIGN KEY ("to_node_id") REFERENCES "public"."Nodes"("id") ON delete CASCADE;

alter table ONLY "public"."Edges"
    ADD CONSTRAINT "edges_from_node_id_fkey" FOREIGN KEY ("from_node_id") REFERENCES "public"."Nodes"("id") ON delete CASCADE;

-- Enable RLS
alter table "public"."Profiles" ENABLE ROW LEVEL SECURITY;
alter table "public"."Workflows" ENABLE ROW LEVEL SECURITY;
alter table "public"."Nodes" ENABLE ROW LEVEL SECURITY;
alter table "public"."Edges" ENABLE ROW LEVEL SECURITY;

-- Create policies
create POLICY "Users can access, edit, and delete their own info" ON "public"."Profiles" TO "authenticated", "anon" USING (("auth"."uid"() = "id"));
create POLICY "Allows users to operate on their own workflows" ON "public"."Workflows" TO "authenticated", "anon" USING (("auth"."uid"() = "user_id"));
create POLICY "Users can update their own nodes" ON "public"."Nodes" TO "authenticated", "anon" USING ((EXISTS ( select 1 from ("public"."Workflows" "w" join "public"."Profiles" "p" on (("w"."user_id" = "p"."id"))) where (("w"."id" = "Nodes"."workflow_id") and ("p"."id" = "auth"."uid"())))));
create POLICY "Users can update their own edges" ON "public"."Edges" TO "authenticated", "anon" USING ((EXISTS ( select 1 from ("public"."Workflows" "w" join "public"."Profiles" "p" on (("w"."user_id" = "p"."id"))) where (("w"."id" = "Edges"."workflow_id") and ("p"."id" = "auth"."uid"())))));

-- Grant permissions
grant USAGE on SCHEMA "public" TO "postgres", "anon", "authenticated", "service_role";

grant all on TABLE "public"."Profiles" to "anon", "authenticated", "service_role";
grant all on TABLE "public"."Workflows" to "anon", "authenticated", "service_role";
grant all on TABLE "public"."Nodes" to "anon", "authenticated", "service_role";
grant all on TABLE "public"."Edges" to "anon", "authenticated", "service_role";

-- Set default privileges
alter DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" grant all on SEQUENCES to "postgres", "anon", "authenticated", "service_role";
alter DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" grant all on FUNCTIONS to "postgres", "anon", "authenticated", "service_role";
alter DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" grant all on TABLES to "postgres", "anon", "authenticated", "service_role";

RESET ALL;
