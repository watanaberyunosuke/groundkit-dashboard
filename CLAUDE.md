# groundkit-dashboard

## Session Learnings (auto-updated by handoff)

<!-- handoff:learnings:begin -->
- GroundKit is completely free: no subscription, ads, donations or paid tier. Vercel Hobby (non-commercial) is therefore allowed for the dashboard and `api/index.py`.
- Warehouse stays MotherDuck with ingest on the GitHub runner. Databricks Free Edition was rejected: outbound internet is limited to an unpublished domain allowlist, three marts use DuckDB `ASOF` joins, and a quota overrun stops compute for the day, which would take the dashboard down.
- Flights are loaded once a day is complete (from 06 UTC the next day); weather, NOTAMs and Hong Kong gate times are the hourly data.
- `ingest` and the `ci.yml` deploy share the `warehouse-writer` concurrency group. A cancelled run with "higher priority waiting request" is a queued run replaced by a newer one; an ingest run cancelled after about 65 minutes is the 60-minute job timeout.
- Accounts stay on Supabase (not Firebase). The Free project is kept awake by `.github/workflows/supabase-keepalive.yml`, which calls `public.keepalive()` (`supabase/migrations/20261103120000_keepalive.sql`) every 3 days. Its URL and publishable key are repository secrets `GROUNDKIT_SUPABASE_URL` and `GROUNDKIT_SUPABASE_PUBLISHABLE_KEY`.
- The anon role has no grants on `profiles` or `user_settings` by design; anything the publishable key must call needs its own function with an explicit grant and a check in `supabase/tests/accounts_test.sql`.
- Supabase migrations are tested in CI (`scripts/test_supabase.sh`) but not deployed: apply them with `supabase db push` or the SQL editor.
- Commits are authored as Harry Watson with no AI attribution; branch names are meaningful.
<!-- handoff:learnings:end -->
