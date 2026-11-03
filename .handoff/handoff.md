# Handoff: Supabase keep-alive and platform review (2026-11-03)

## Task
Keep GroundKit's Supabase Free project from pausing, and decide whether Databricks Free Edition should replace MotherDuck or host the API. Why: GroundKit is free, so it must run on free tiers without outages.

## Status
- Done: PR #81 (keep-alive workflow), PR #82 (secrets, `public.keepalive()` migration, test, docs). Both merged.
- Remaining: confirm the `keepalive()` migration is applied to the production Supabase project and that a `supabase-keepalive` run on `main` returns HTTP 200. First scheduled run: 2026-11-04 02:41 UTC.

## Key decisions
- Keep MotherDuck; reject Databricks Free Edition (egress allowlist, `ASOF` joins, quota outages). Reason: no fresher data, more fragile serving.
- Keep Supabase, not Firebase. Reason: pausing is fixed by the keep-alive; Firebase would mean rewriting auth, sync and tests.
- Credentials as secrets, not variables (Harry's choice).
- Keep-alive calls a dedicated function. Reason: anon has no table grants by design.

## Failed approaches
- Workflow read `vars.*` → values were secrets → empty-variable error. Read `secrets.*`.
- Read `profiles` as anon → HTTP 401 / `42501` → anon is locked out by design. Use `rpc/keepalive`.
- `gh pr create` → GraphQL blocked in cloud sessions → use `gh api` REST.

## Next steps
1. Apply `supabase/migrations/20261103120000_keepalive.sql` to production if not done; run `supabase-keepalive` on `main` and check for HTTP 200 (404: migration missing; 401: grant missing).
2. Optional: GitHub starts `ingest.yml` only every 4 to 7 hours instead of hourly; an external cron calling `workflow_dispatch` would fix it.
3. Review open Dependabot security alert #2.

## Modified files (PRs #81, #82)
- `.github/workflows/supabase-keepalive.yml`: new; calls `rpc/keepalive` every 3 days with repository secrets.
- `supabase/migrations/20261103120000_keepalive.sql`: new; `public.keepalive()` granted to anon and authenticated.
- `supabase/tests/accounts_test.sql`: checks anon can call `keepalive()`.
- `docs/accounts.md`: section 3, step 6 (keep-alive setup).
