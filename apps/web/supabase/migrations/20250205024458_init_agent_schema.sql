create extension if not exists "vector" with schema "public" version '0.7.4';

alter table "public"."Profiles" drop constraint "profiles_email_key";

alter table "public"."Profiles" drop constraint "profiles_id_fkey";

drop index if exists "public"."profiles_email_key";

create table "public"."AgentTools" (
    "agent_id" uuid not null,
    "tool_id" uuid not null,
    "configuration" jsonb,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."AgentTools" enable row level security;

create table "public"."Agents" (
    "id" uuid not null default uuid_generate_v4(),
    "name" character varying(255) not null,
    "description" text,
    "config" jsonb not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."Agents" enable row level security;

create table "public"."Executions" (
    "id" uuid not null default uuid_generate_v4(),
    "agent_id" uuid not null,
    "session_id" uuid not null,
    "input" jsonb not null,
    "output" jsonb,
    "errors" jsonb,
    "metrics" jsonb,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."Executions" enable row level security;

create table "public"."Tools" (
    "id" uuid not null default uuid_generate_v4(),
    "name" character varying(255) not null,
    "description" text,
    "category" character varying(50) not null,
    "parameters" jsonb not null,
    "version" character varying(20) not null default '1.0.0'::character varying,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."Tools" enable row level security;

create table "public"."VectorMemories" (
    "id" uuid not null default uuid_generate_v4(),
    "agent_id" uuid not null,
    "content" text not null,
    "embedding" vector(1536) not null,
    "metadata" jsonb not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."VectorMemories" enable row level security;

CREATE UNIQUE INDEX "AgentTools_pkey" ON public."AgentTools" USING btree (agent_id, tool_id);

CREATE UNIQUE INDEX "Agents_pkey" ON public."Agents" USING btree (id);

CREATE UNIQUE INDEX "Executions_pkey" ON public."Executions" USING btree (id);

CREATE INDEX "IDX_AgentTools_Agent" ON public."AgentTools" USING btree (agent_id);

CREATE INDEX "IDX_Executions_Session" ON public."Executions" USING btree (session_id);

CREATE INDEX "IDX_Tools_Category" ON public."Tools" USING btree (category);

CREATE INDEX "IDX_VectorMemories_Agent" ON public."VectorMemories" USING btree (agent_id);

CREATE UNIQUE INDEX "Tools_name_key" ON public."Tools" USING btree (name);

CREATE UNIQUE INDEX "Tools_pkey" ON public."Tools" USING btree (id);

CREATE UNIQUE INDEX "VectorMemories_pkey" ON public."VectorMemories" USING btree (id);

alter table "public"."AgentTools" add constraint "AgentTools_pkey" PRIMARY KEY using index "AgentTools_pkey";

alter table "public"."Agents" add constraint "Agents_pkey" PRIMARY KEY using index "Agents_pkey";

alter table "public"."Executions" add constraint "Executions_pkey" PRIMARY KEY using index "Executions_pkey";

alter table "public"."Tools" add constraint "Tools_pkey" PRIMARY KEY using index "Tools_pkey";

alter table "public"."VectorMemories" add constraint "VectorMemories_pkey" PRIMARY KEY using index "VectorMemories_pkey";

alter table "public"."AgentTools" add constraint "AgentTools_agent_id_fkey" FOREIGN KEY (agent_id) REFERENCES "Agents"(id) ON DELETE CASCADE not valid;

alter table "public"."AgentTools" validate constraint "AgentTools_agent_id_fkey";

alter table "public"."AgentTools" add constraint "AgentTools_tool_id_fkey" FOREIGN KEY (tool_id) REFERENCES "Tools"(id) ON DELETE CASCADE not valid;

alter table "public"."AgentTools" validate constraint "AgentTools_tool_id_fkey";

alter table "public"."Executions" add constraint "Executions_agent_id_fkey" FOREIGN KEY (agent_id) REFERENCES "Agents"(id) not valid;

alter table "public"."Executions" validate constraint "Executions_agent_id_fkey";

alter table "public"."Tools" add constraint "Tools_category_check" CHECK (((category)::text = ANY ((ARRAY['browser'::character varying, 'llm'::character varying, 'data'::character varying, 'utility'::character varying])::text[]))) not valid;

alter table "public"."Tools" validate constraint "Tools_category_check";

alter table "public"."Tools" add constraint "Tools_name_key" UNIQUE using index "Tools_name_key";

alter table "public"."VectorMemories" add constraint "VectorMemories_agent_id_fkey" FOREIGN KEY (agent_id) REFERENCES "Agents"(id) not valid;

alter table "public"."VectorMemories" validate constraint "VectorMemories_agent_id_fkey";

grant delete on table "public"."AgentTools" to "anon";

grant insert on table "public"."AgentTools" to "anon";

grant references on table "public"."AgentTools" to "anon";

grant select on table "public"."AgentTools" to "anon";

grant trigger on table "public"."AgentTools" to "anon";

grant truncate on table "public"."AgentTools" to "anon";

grant update on table "public"."AgentTools" to "anon";

grant delete on table "public"."AgentTools" to "authenticated";

grant insert on table "public"."AgentTools" to "authenticated";

grant references on table "public"."AgentTools" to "authenticated";

grant select on table "public"."AgentTools" to "authenticated";

grant trigger on table "public"."AgentTools" to "authenticated";

grant truncate on table "public"."AgentTools" to "authenticated";

grant update on table "public"."AgentTools" to "authenticated";

grant delete on table "public"."AgentTools" to "service_role";

grant insert on table "public"."AgentTools" to "service_role";

grant references on table "public"."AgentTools" to "service_role";

grant select on table "public"."AgentTools" to "service_role";

grant trigger on table "public"."AgentTools" to "service_role";

grant truncate on table "public"."AgentTools" to "service_role";

grant update on table "public"."AgentTools" to "service_role";

grant delete on table "public"."Agents" to "anon";

grant insert on table "public"."Agents" to "anon";

grant references on table "public"."Agents" to "anon";

grant select on table "public"."Agents" to "anon";

grant trigger on table "public"."Agents" to "anon";

grant truncate on table "public"."Agents" to "anon";

grant update on table "public"."Agents" to "anon";

grant delete on table "public"."Agents" to "authenticated";

grant insert on table "public"."Agents" to "authenticated";

grant references on table "public"."Agents" to "authenticated";

grant select on table "public"."Agents" to "authenticated";

grant trigger on table "public"."Agents" to "authenticated";

grant truncate on table "public"."Agents" to "authenticated";

grant update on table "public"."Agents" to "authenticated";

grant delete on table "public"."Agents" to "service_role";

grant insert on table "public"."Agents" to "service_role";

grant references on table "public"."Agents" to "service_role";

grant select on table "public"."Agents" to "service_role";

grant trigger on table "public"."Agents" to "service_role";

grant truncate on table "public"."Agents" to "service_role";

grant update on table "public"."Agents" to "service_role";

grant delete on table "public"."Executions" to "anon";

grant insert on table "public"."Executions" to "anon";

grant references on table "public"."Executions" to "anon";

grant select on table "public"."Executions" to "anon";

grant trigger on table "public"."Executions" to "anon";

grant truncate on table "public"."Executions" to "anon";

grant update on table "public"."Executions" to "anon";

grant delete on table "public"."Executions" to "authenticated";

grant insert on table "public"."Executions" to "authenticated";

grant references on table "public"."Executions" to "authenticated";

grant select on table "public"."Executions" to "authenticated";

grant trigger on table "public"."Executions" to "authenticated";

grant truncate on table "public"."Executions" to "authenticated";

grant update on table "public"."Executions" to "authenticated";

grant delete on table "public"."Executions" to "service_role";

grant insert on table "public"."Executions" to "service_role";

grant references on table "public"."Executions" to "service_role";

grant select on table "public"."Executions" to "service_role";

grant trigger on table "public"."Executions" to "service_role";

grant truncate on table "public"."Executions" to "service_role";

grant update on table "public"."Executions" to "service_role";

grant delete on table "public"."Tools" to "anon";

grant insert on table "public"."Tools" to "anon";

grant references on table "public"."Tools" to "anon";

grant select on table "public"."Tools" to "anon";

grant trigger on table "public"."Tools" to "anon";

grant truncate on table "public"."Tools" to "anon";

grant update on table "public"."Tools" to "anon";

grant delete on table "public"."Tools" to "authenticated";

grant insert on table "public"."Tools" to "authenticated";

grant references on table "public"."Tools" to "authenticated";

grant select on table "public"."Tools" to "authenticated";

grant trigger on table "public"."Tools" to "authenticated";

grant truncate on table "public"."Tools" to "authenticated";

grant update on table "public"."Tools" to "authenticated";

grant delete on table "public"."Tools" to "service_role";

grant insert on table "public"."Tools" to "service_role";

grant references on table "public"."Tools" to "service_role";

grant select on table "public"."Tools" to "service_role";

grant trigger on table "public"."Tools" to "service_role";

grant truncate on table "public"."Tools" to "service_role";

grant update on table "public"."Tools" to "service_role";

grant delete on table "public"."VectorMemories" to "anon";

grant insert on table "public"."VectorMemories" to "anon";

grant references on table "public"."VectorMemories" to "anon";

grant select on table "public"."VectorMemories" to "anon";

grant trigger on table "public"."VectorMemories" to "anon";

grant truncate on table "public"."VectorMemories" to "anon";

grant update on table "public"."VectorMemories" to "anon";

grant delete on table "public"."VectorMemories" to "authenticated";

grant insert on table "public"."VectorMemories" to "authenticated";

grant references on table "public"."VectorMemories" to "authenticated";

grant select on table "public"."VectorMemories" to "authenticated";

grant trigger on table "public"."VectorMemories" to "authenticated";

grant truncate on table "public"."VectorMemories" to "authenticated";

grant update on table "public"."VectorMemories" to "authenticated";

grant delete on table "public"."VectorMemories" to "service_role";

grant insert on table "public"."VectorMemories" to "service_role";

grant references on table "public"."VectorMemories" to "service_role";

grant select on table "public"."VectorMemories" to "service_role";

grant trigger on table "public"."VectorMemories" to "service_role";

grant truncate on table "public"."VectorMemories" to "service_role";

grant update on table "public"."VectorMemories" to "service_role";

create policy "AgentTools Owner Access"
on "public"."AgentTools"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM "Agents"
  WHERE (("Agents".id = "AgentTools".agent_id) AND ((("Agents".config ->> 'owner_id'::text))::uuid = auth.uid())))));


create policy "Agents Owner Access"
on "public"."Agents"
as permissive
for all
to public
using ((((config ->> 'owner_id'::text))::uuid = auth.uid()))
with check ((((config ->> 'owner_id'::text))::uuid = auth.uid()));


create policy "Executions Owner Access"
on "public"."Executions"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM "Agents"
  WHERE (("Agents".id = "Executions".agent_id) AND ((("Agents".config ->> 'owner_id'::text))::uuid = auth.uid())))));


create policy "Tools Restricted Access"
on "public"."Tools"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM "AgentTools"
  WHERE (("AgentTools".tool_id = "Tools".id) AND ("AgentTools".agent_id IN ( SELECT "Agents".id
           FROM "Agents"
          WHERE ((("Agents".config ->> 'owner_id'::text))::uuid = auth.uid())))))));


create policy "VectorMemories Owner Access"
on "public"."VectorMemories"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM "Agents"
  WHERE (("Agents".id = "VectorMemories".agent_id) AND ((("Agents".config ->> 'owner_id'::text))::uuid = auth.uid())))));



