create extension if not exists "pg_jsonschema" with schema "extensions";


create type "public"."WorkflowState" as enum ('Initial', 'Build', 'Running', 'Error', 'Complete');

create table "public"."Edges" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
    "workflow_id" uuid not null,
    "to_node_id" uuid not null,
    "from_node_id" uuid not null,
    "updated_at" timestamp with time zone
);


alter table "public"."Edges" enable row level security;

create table "public"."Nodes" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
    "workflow_id" uuid not null,
    "state" text,
    "current_step" text,
    "updated_at" timestamp with time zone
);


alter table "public"."Nodes" enable row level security;

create table "public"."Profiles" (
    "id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "email" text,
    "updated_at" timestamp with time zone default now(),
    "subscription_plan" text,
    "username" text,
    "first_name" text,
    "last_name" text
);


alter table "public"."Profiles" enable row level security;

create table "public"."Workflows" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "state" "WorkflowState" not null default 'Initial'::"WorkflowState",
    "current_step" text,
    "data" jsonb,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP
);


alter table "public"."Workflows" enable row level security;

CREATE UNIQUE INDEX "Nodes_id_key" ON public."Nodes" USING btree (id);

CREATE UNIQUE INDEX edges_pkey ON public."Edges" USING btree (id);

CREATE UNIQUE INDEX edges_workflow_id_key ON public."Edges" USING btree (workflow_id);

CREATE UNIQUE INDEX nodes_pkey ON public."Nodes" USING btree (id);

CREATE UNIQUE INDEX profiles_email_key ON public."Profiles" USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public."Profiles" USING btree (id);

CREATE UNIQUE INDEX workflows_pkey ON public."Workflows" USING btree (id);

alter table "public"."Edges" add constraint "edges_pkey" PRIMARY KEY using index "edges_pkey";

alter table "public"."Nodes" add constraint "nodes_pkey" PRIMARY KEY using index "nodes_pkey";

alter table "public"."Profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."Workflows" add constraint "workflows_pkey" PRIMARY KEY using index "workflows_pkey";

alter table "public"."Edges" add constraint "edges_from_node_id_fkey" FOREIGN KEY (from_node_id) REFERENCES "Nodes"(id) ON DELETE CASCADE not valid;

alter table "public"."Edges" validate constraint "edges_from_node_id_fkey";

alter table "public"."Edges" add constraint "edges_to_node_id_fkey" FOREIGN KEY (to_node_id) REFERENCES "Nodes"(id) ON DELETE CASCADE not valid;

alter table "public"."Edges" validate constraint "edges_to_node_id_fkey";

alter table "public"."Edges" add constraint "edges_workflow_id_fkey" FOREIGN KEY (workflow_id) REFERENCES "Workflows"(id) ON DELETE CASCADE not valid;

alter table "public"."Edges" validate constraint "edges_workflow_id_fkey";

alter table "public"."Edges" add constraint "edges_workflow_id_key" UNIQUE using index "edges_workflow_id_key";

alter table "public"."Nodes" add constraint "Nodes_id_key" UNIQUE using index "Nodes_id_key";

alter table "public"."Nodes" add constraint "nodes_workflow_id_fkey" FOREIGN KEY (workflow_id) REFERENCES "Workflows"(id) ON DELETE CASCADE not valid;

alter table "public"."Nodes" validate constraint "nodes_workflow_id_fkey";

alter table "public"."Profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."Profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."Profiles" validate constraint "profiles_id_fkey";

alter table "public"."Workflows" add constraint "workflows_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "Profiles"(id) not valid;

alter table "public"."Workflows" validate constraint "workflows_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_new_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  SET search_path = '';
  INSERT INTO public."Profiles" (id, email, created_at)
  VALUES (NEW.id, NEW.email, NEW.created_at);
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."Edges" to "anon";

grant insert on table "public"."Edges" to "anon";

grant references on table "public"."Edges" to "anon";

grant select on table "public"."Edges" to "anon";

grant trigger on table "public"."Edges" to "anon";

grant truncate on table "public"."Edges" to "anon";

grant update on table "public"."Edges" to "anon";

grant delete on table "public"."Edges" to "authenticated";

grant insert on table "public"."Edges" to "authenticated";

grant references on table "public"."Edges" to "authenticated";

grant select on table "public"."Edges" to "authenticated";

grant trigger on table "public"."Edges" to "authenticated";

grant truncate on table "public"."Edges" to "authenticated";

grant update on table "public"."Edges" to "authenticated";

grant delete on table "public"."Edges" to "service_role";

grant insert on table "public"."Edges" to "service_role";

grant references on table "public"."Edges" to "service_role";

grant select on table "public"."Edges" to "service_role";

grant trigger on table "public"."Edges" to "service_role";

grant truncate on table "public"."Edges" to "service_role";

grant update on table "public"."Edges" to "service_role";

grant delete on table "public"."Nodes" to "anon";

grant insert on table "public"."Nodes" to "anon";

grant references on table "public"."Nodes" to "anon";

grant select on table "public"."Nodes" to "anon";

grant trigger on table "public"."Nodes" to "anon";

grant truncate on table "public"."Nodes" to "anon";

grant update on table "public"."Nodes" to "anon";

grant delete on table "public"."Nodes" to "authenticated";

grant insert on table "public"."Nodes" to "authenticated";

grant references on table "public"."Nodes" to "authenticated";

grant select on table "public"."Nodes" to "authenticated";

grant trigger on table "public"."Nodes" to "authenticated";

grant truncate on table "public"."Nodes" to "authenticated";

grant update on table "public"."Nodes" to "authenticated";

grant delete on table "public"."Nodes" to "service_role";

grant insert on table "public"."Nodes" to "service_role";

grant references on table "public"."Nodes" to "service_role";

grant select on table "public"."Nodes" to "service_role";

grant trigger on table "public"."Nodes" to "service_role";

grant truncate on table "public"."Nodes" to "service_role";

grant update on table "public"."Nodes" to "service_role";

grant delete on table "public"."Profiles" to "anon";

grant insert on table "public"."Profiles" to "anon";

grant references on table "public"."Profiles" to "anon";

grant select on table "public"."Profiles" to "anon";

grant trigger on table "public"."Profiles" to "anon";

grant truncate on table "public"."Profiles" to "anon";

grant update on table "public"."Profiles" to "anon";

grant delete on table "public"."Profiles" to "authenticated";

grant insert on table "public"."Profiles" to "authenticated";

grant references on table "public"."Profiles" to "authenticated";

grant select on table "public"."Profiles" to "authenticated";

grant trigger on table "public"."Profiles" to "authenticated";

grant truncate on table "public"."Profiles" to "authenticated";

grant update on table "public"."Profiles" to "authenticated";

grant delete on table "public"."Profiles" to "service_role";

grant insert on table "public"."Profiles" to "service_role";

grant references on table "public"."Profiles" to "service_role";

grant select on table "public"."Profiles" to "service_role";

grant trigger on table "public"."Profiles" to "service_role";

grant truncate on table "public"."Profiles" to "service_role";

grant update on table "public"."Profiles" to "service_role";

grant delete on table "public"."Workflows" to "anon";

grant insert on table "public"."Workflows" to "anon";

grant references on table "public"."Workflows" to "anon";

grant select on table "public"."Workflows" to "anon";

grant trigger on table "public"."Workflows" to "anon";

grant truncate on table "public"."Workflows" to "anon";

grant update on table "public"."Workflows" to "anon";

grant delete on table "public"."Workflows" to "authenticated";

grant insert on table "public"."Workflows" to "authenticated";

grant references on table "public"."Workflows" to "authenticated";

grant select on table "public"."Workflows" to "authenticated";

grant trigger on table "public"."Workflows" to "authenticated";

grant truncate on table "public"."Workflows" to "authenticated";

grant update on table "public"."Workflows" to "authenticated";

grant delete on table "public"."Workflows" to "service_role";

grant insert on table "public"."Workflows" to "service_role";

grant references on table "public"."Workflows" to "service_role";

grant select on table "public"."Workflows" to "service_role";

grant trigger on table "public"."Workflows" to "service_role";

grant truncate on table "public"."Workflows" to "service_role";

grant update on table "public"."Workflows" to "service_role";

create policy "Users can update their own edges"
on "public"."Edges"
as permissive
for all
to authenticated, anon
using ((EXISTS ( SELECT 1
   FROM ("Workflows" w
     JOIN "Profiles" p ON ((w.user_id = p.id)))
  WHERE ((w.id = "Edges".workflow_id) AND (p.id = auth.uid())))));


create policy "Users can update their own nodes"
on "public"."Nodes"
as permissive
for all
to authenticated, anon
using ((EXISTS ( SELECT 1
   FROM ("Workflows" w
     JOIN "Profiles" p ON ((w.user_id = p.id)))
  WHERE ((w.id = "Nodes".workflow_id) AND (p.id = auth.uid())))));


create policy "Users can access, edit, and delete their own info"
on "public"."Profiles"
as permissive
for all
to authenticated, anon
using ((auth.uid() = id));


create policy "Allows users to operate on their own workflows"
on "public"."Workflows"
as permissive
for all
to authenticated, anon
using ((auth.uid() = user_id));



