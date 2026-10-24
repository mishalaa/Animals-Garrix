# Edge Functions

Server-side code that runs on Supabase. Nothing is deployed here yet.

Planned for Phase 2:

- `scan-report/` — receives a report id, loads the file from the `pet-files` bucket, sends it to a
  vision AI model, validates the returned JSON, and saves it to `reports.extracted` for the owner to
  confirm. The AI provider key lives only here (as a Supabase secret), never in the app.

Create a function with `npx supabase functions new scan-report` and deploy with
`npx supabase functions deploy scan-report`.
