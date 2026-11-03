-- Free plan keep-alive. Supabase pauses Free projects with too little database activity over
-- 7 days; .github/workflows/supabase-keepalive.yml calls this through the REST API every 3 days
-- with the publishable key. It runs a query in Postgres and reads no user data, so it is the
-- only thing the anon role may call.
create or replace function public.keepalive()
returns boolean
language sql
stable
set search_path = ''
as $$ select true $$;

revoke all on function public.keepalive() from public;
grant execute on function public.keepalive() to anon, authenticated;
