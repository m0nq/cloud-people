drop policy "AgentTools Owner Access" on "public"."AgentTools";

drop policy "Agents Owner Access" on "public"."Agents";

drop policy "Executions Owner Access" on "public"."Executions";

drop policy "Users can access, edit, and delete their own info" on "public"."Profiles";

drop policy "Tools Restricted Access" on "public"."Tools";

drop policy "VectorMemories Owner Access" on "public"."VectorMemories";

drop policy "Allows users to operate on their own workflows" on "public"."Workflows";

alter table "public"."Nodes" drop constraint "valid_node_type";

alter table "public"."Tools" drop constraint "Tools_category_check";

alter table "public"."Agents" add column "created_by" uuid default auth.uid();

alter table "public"."Executions" alter column "current_status" set default 'initial'::text;

alter table "public"."Tools" add column "created_by" uuid default auth.uid();

CREATE UNIQUE INDEX profiles_email_key ON public."Profiles" USING btree (email);

alter table "public"."Agents" add constraint "Agents_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."Agents" validate constraint "Agents_created_by_fkey";

alter table "public"."Profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."Profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."Profiles" validate constraint "profiles_id_fkey";

alter table "public"."Tools" add constraint "Tools_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."Tools" validate constraint "Tools_created_by_fkey";

alter table "public"."Tools" add constraint "Tools_category_check" CHECK (((category)::text = ANY ((ARRAY['browser'::character varying, 'llm'::character varying, 'data'::character varying, 'utility'::character varying])::text[]))) not valid;

alter table "public"."Tools" validate constraint "Tools_category_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_executions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

create policy "AgentTools Owner Access"
on "public"."AgentTools"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM "Agents"
  WHERE (("Agents".id = "AgentTools".agent_id) AND ("Agents".created_by = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM "Agents"
  WHERE (("Agents".id = "AgentTools".agent_id) AND ("Agents".created_by = auth.uid())))));


create policy "Agents Owner Access"
on "public"."Agents"
as permissive
for all
to authenticated
using ((auth.uid() = created_by))
with check ((auth.uid() = created_by));


create policy "Executions Owner Access"
on "public"."Executions"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM "Agents"
  WHERE (("Agents".id = "Executions".agent_id) AND ("Agents".created_by = auth.uid())))));


create policy "Users can access, edit, and delete their own info"
on "public"."Profiles"
as permissive
for all
to anon, authenticated
using ((auth.uid() = id));


create policy "Tools Restricted Access"
on "public"."Tools"
as permissive
for all
to authenticated
using (true)
with check ((auth.uid() = created_by));


create policy "VectorMemories Owner Access"
on "public"."VectorMemories"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM "Agents"
  WHERE (("Agents".id = "VectorMemories".agent_id) AND ("Agents".created_by = auth.uid())))));


create policy "Allows users to operate on their own workflows"
on "public"."Workflows"
as permissive
for all
to anon, authenticated
using ((auth.uid() = user_id));


CREATE TRIGGER update_executions_updated_at BEFORE UPDATE ON public."Executions" FOR EACH ROW EXECUTE FUNCTION update_executions_updated_at();


