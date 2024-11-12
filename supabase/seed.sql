

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


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_jsonschema" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






create type "public"."WorkflowState" as ENUM (
    'Initial',
    'Build',
    'Running',
    'Error',
    'Complete'
);


ALTER type "public"."WorkflowState" OWNER TO "postgres";


COMMENT ON type "public"."WorkflowState" is 'The possible states a workflow can be in';



create or replace function "public"."create_new_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    as $$
begin
  set search_path = '';
  insert into public."Profiles" (id, email, created_at)
  values (NEW.id, NEW.email, NEW.created_at);
  return new;
end;
$$;


alter function "public"."create_new_profile"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


create TABLE IF NOT EXISTS "public"."Edges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "to_node_id" "uuid" NOT NULL,
    "from_node_id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone
);


alter table "public"."Edges" OWNER TO "postgres";


comment on table "public"."Edges" is 'Edges of the nodes of a users workflow';



create TABLE IF NOT EXISTS "public"."Nodes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "state" "text",
    "current_step" "text",
    "updated_at" timestamp with time zone
);


alter table "public"."Nodes" OWNER TO "postgres";


comment on table "public"."Nodes" is 'Nodes of a users workflow';



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


alter table "public"."Profiles" OWNER TO "postgres";


comment on table "public"."Profiles" is 'User data accessible to the app. Not for auth';



comment on column "public"."Profiles"."created_at" is 'Timestamp of when user was created within the system';



comment on column "public"."Profiles"."email" is 'Email of user';



comment on column "public"."Profiles"."updated_at" is 'Timestamp when user data was last updated.';



comment on column "public"."Profiles"."subscription_plan" is 'Reference to the user''s subscription plan - TODO: change to enum types';



comment on column "public"."Profiles"."username" is 'Identifiable name for user profile';



comment on column "public"."Profiles"."first_name" is 'First name of user for user profiles';



comment on column "public"."Profiles"."last_name" is 'Last of user for user profiles.';



create TABLE IF NOT EXISTS "public"."Workflows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "state" "public"."WorkflowState" DEFAULT 'Initial'::"public"."WorkflowState" NOT NULL,
    "current_step" "text",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


alter table "public"."Workflows" OWNER TO "postgres";


comment on table "public"."Workflows" is 'Users list of workflow graphs';



alter table ONLY "public"."Nodes"
    ADD CONSTRAINT "Nodes_id_key" UNIQUE ("id");



alter table ONLY "public"."Edges"
    ADD CONSTRAINT "edges_pkey" PRIMARY KEY ("id");



alter table ONLY "public"."Edges"
    ADD CONSTRAINT "edges_workflow_id_key" UNIQUE ("workflow_id");



alter table ONLY "public"."Nodes"
    ADD CONSTRAINT "nodes_pkey" PRIMARY KEY ("id");



alter table ONLY "public"."Profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



alter table ONLY "public"."Profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



alter table ONLY "public"."Workflows"
    ADD CONSTRAINT "workflows_pkey" PRIMARY KEY ("id");



alter table ONLY "public"."Edges"
    ADD CONSTRAINT "edges_from_node_id_fkey" FOREIGN KEY ("from_node_id") REFERENCES "public"."Nodes"("id") ON delete CASCADE;



alter table ONLY "public"."Edges"
    ADD CONSTRAINT "edges_to_node_id_fkey" FOREIGN KEY ("to_node_id") REFERENCES "public"."Nodes"("id") ON delete CASCADE;



alter table ONLY "public"."Edges"
    ADD CONSTRAINT "edges_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."Workflows"("id") ON delete CASCADE;



alter table ONLY "public"."Nodes"
    ADD CONSTRAINT "nodes_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."Workflows"("id") ON delete CASCADE;



alter table ONLY "public"."Profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON delete CASCADE;



alter table ONLY "public"."Workflows"
    ADD CONSTRAINT "workflows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Profiles"("id");



create POLICY "Allows users to operate on their own workflows" ON "public"."Workflows" TO "authenticated", "anon" USING (("auth"."uid"() = "user_id"));



alter table "public"."Edges" ENABLE ROW LEVEL SECURITY;


alter table "public"."Nodes" ENABLE ROW LEVEL SECURITY;


alter table "public"."Profiles" ENABLE ROW LEVEL SECURITY;


create POLICY "Users can access, edit, and delete their own info" ON "public"."Profiles" TO "authenticated", "anon" USING (("auth"."uid"() = "id"));



create POLICY "Users can update their own edges" ON "public"."Edges" TO "authenticated", "anon" USING ((EXISTS ( select 1
   from ("public"."Workflows" "w"
     join "public"."Profiles" "p" on (("w"."user_id" = "p"."id")))
  where (("w"."id" = "Edges"."workflow_id") and ("p"."id" = "auth"."uid"())))));



create POLICY "Users can update their own nodes" ON "public"."Nodes" TO "authenticated", "anon" USING ((EXISTS ( select 1
   from ("public"."Workflows" "w"
     join "public"."Profiles" "p" on (("w"."user_id" = "p"."id")))
  where (("w"."id" = "Nodes"."workflow_id") and ("p"."id" = "auth"."uid"())))));



alter table "public"."Workflows" ENABLE ROW LEVEL SECURITY;




alter PUBLICATION "supabase_realtime" OWNER TO "postgres";


grant USAGE on SCHEMA "public" TO "postgres";
grant USAGE on SCHEMA "public" TO "anon";
grant USAGE on SCHEMA "public" TO "authenticated";
grant USAGE on SCHEMA "public" TO "service_role";
































































































































































































grant all on FUNCTION "public"."create_new_profile"() TO "anon";
grant all on FUNCTION "public"."create_new_profile"() TO "authenticated";
grant all on FUNCTION "public"."create_new_profile"() TO "service_role";


















grant all on TABLE "public"."Edges" to "anon";
grant all on TABLE "public"."Edges" to "authenticated";
grant all on TABLE "public"."Edges" to "service_role";



grant all on TABLE "public"."Nodes" to "anon";
grant all on TABLE "public"."Nodes" to "authenticated";
grant all on TABLE "public"."Nodes" to "service_role";



grant all on TABLE "public"."Profiles" to "anon";
grant all on TABLE "public"."Profiles" to "authenticated";
grant all on TABLE "public"."Profiles" to "service_role";



grant all on TABLE "public"."Workflows" to "anon";
grant all on TABLE "public"."Workflows" to "authenticated";
grant all on TABLE "public"."Workflows" to "service_role";



alter DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" grant all on SEQUENCES  to "postgres";
alter DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" grant all on SEQUENCES  to "anon";
alter DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" grant all on SEQUENCES  to "authenticated";
alter DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" grant all on SEQUENCES  to "service_role";






alter DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" grant all on FUNCTIONS  to "postgres";
alter DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" grant all on FUNCTIONS  to "anon";
alter DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" grant all on FUNCTIONS  to "authenticated";
alter DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" grant all on FUNCTIONS  to "service_role";






alter DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" grant all on TABLES  to "postgres";
alter DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" grant all on TABLES  to "anon";
alter DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" grant all on TABLES  to "authenticated";
alter DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" grant all on TABLES  to "service_role";






























RESET ALL;
