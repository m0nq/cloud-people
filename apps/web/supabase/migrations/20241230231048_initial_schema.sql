

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
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






CREATE TYPE "public"."WorkflowState" AS ENUM (
    'Initial',
    'Build',
    'Running',
    'Error',
    'Complete'
);


ALTER TYPE "public"."WorkflowState" OWNER TO "postgres";


COMMENT ON TYPE "public"."WorkflowState" IS 'The possible states a workflow can be in';



CREATE OR REPLACE FUNCTION "public"."create_new_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
insert into public."Profiles" (id, email, created_at)
values (NEW.id, NEW.email, NEW.created_at);
return new;
end;
$$;


ALTER FUNCTION "public"."create_new_profile"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."Edges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "to_node_id" "uuid" NOT NULL,
    "from_node_id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."Edges" OWNER TO "postgres";


COMMENT ON TABLE "public"."Edges" IS 'Edges of the nodes of a users workflow';



CREATE TABLE IF NOT EXISTS "public"."Nodes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "state" "text",
    "current_step" "text",
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."Nodes" OWNER TO "postgres";


COMMENT ON TABLE "public"."Nodes" IS 'Nodes of a users workflow';



CREATE TABLE IF NOT EXISTS "public"."Profiles" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "email" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "subscription_plan" "text",
    "username" "text",
    "first_name" "text",
    "last_name" "text"
);


ALTER TABLE "public"."Profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."Profiles" IS 'User data accessible to the app. Not for auth';



COMMENT ON COLUMN "public"."Profiles"."created_at" IS 'Timestamp of when user was created within the system';



COMMENT ON COLUMN "public"."Profiles"."email" IS 'Email of user';



COMMENT ON COLUMN "public"."Profiles"."updated_at" IS 'Timestamp when user data was last updated.';



COMMENT ON COLUMN "public"."Profiles"."subscription_plan" IS 'Reference to the user''s subscription plan - TODO: change to enum types';



COMMENT ON COLUMN "public"."Profiles"."username" IS 'Identifiable name for user profile';



COMMENT ON COLUMN "public"."Profiles"."first_name" IS 'First name of user for user profiles';



COMMENT ON COLUMN "public"."Profiles"."last_name" IS 'Last of user for user profiles.';



CREATE TABLE IF NOT EXISTS "public"."Workflows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "state" "public"."WorkflowState" DEFAULT 'Initial'::"public"."WorkflowState" NOT NULL,
    "current_step" "text",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."Workflows" OWNER TO "postgres";


COMMENT ON TABLE "public"."Workflows" IS 'Users list of workflow graphs';



ALTER TABLE ONLY "public"."Edges"
    ADD CONSTRAINT "edges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Nodes"
    ADD CONSTRAINT "nodes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."Profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Workflows"
    ADD CONSTRAINT "workflows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Edges"
    ADD CONSTRAINT "edges_from_node_id_fkey" FOREIGN KEY ("from_node_id") REFERENCES "public"."Nodes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Edges"
    ADD CONSTRAINT "edges_to_node_id_fkey" FOREIGN KEY ("to_node_id") REFERENCES "public"."Nodes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Edges"
    ADD CONSTRAINT "edges_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."Workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Nodes"
    ADD CONSTRAINT "nodes_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."Workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Workflows"
    ADD CONSTRAINT "workflows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Profiles"("id");



CREATE POLICY "Allows users to operate on their own workflows" ON "public"."Workflows" TO "authenticated", "anon" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."Edges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Nodes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Users can access, edit, and delete their own info" ON "public"."Profiles" TO "authenticated", "anon" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own edges" ON "public"."Edges" TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM ("public"."Workflows" "w"
     JOIN "public"."Profiles" "p" ON (("w"."user_id" = "p"."id")))
  WHERE (("w"."id" = "Edges"."workflow_id") AND ("p"."id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own nodes" ON "public"."Nodes" TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM ("public"."Workflows" "w"
     JOIN "public"."Profiles" "p" ON (("w"."user_id" = "p"."id")))
  WHERE (("w"."id" = "Nodes"."workflow_id") AND ("p"."id" = "auth"."uid"())))));



ALTER TABLE "public"."Workflows" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
































































































































































































GRANT ALL ON FUNCTION "public"."create_new_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_new_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_new_profile"() TO "service_role";


















GRANT ALL ON TABLE "public"."Edges" TO "anon";
GRANT ALL ON TABLE "public"."Edges" TO "authenticated";
GRANT ALL ON TABLE "public"."Edges" TO "service_role";



GRANT ALL ON TABLE "public"."Nodes" TO "anon";
GRANT ALL ON TABLE "public"."Nodes" TO "authenticated";
GRANT ALL ON TABLE "public"."Nodes" TO "service_role";



GRANT ALL ON TABLE "public"."Profiles" TO "anon";
GRANT ALL ON TABLE "public"."Profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."Profiles" TO "service_role";



GRANT ALL ON TABLE "public"."Workflows" TO "anon";
GRANT ALL ON TABLE "public"."Workflows" TO "authenticated";
GRANT ALL ON TABLE "public"."Workflows" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
