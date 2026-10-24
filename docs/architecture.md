# Architecture

```
┌──────────────────────────────┐        ┌──────────────────────────────────┐
│ frontend/  (Expo app)        │        │ backend/  (Supabase)             │
│                              │  HTTPS │                                  │
│ screens  ─▶ hooks/queries ─▶ │───────▶│ Auth      sign-up, sessions      │
│              services/api    │        │ Postgres  tables + Row Level     │
│                              │        │           Security per pet       │
│ lib/schedule  (reminders)    │        │ Storage   private pet-files      │
│ lib/summary   (vet PDF)      │        │ Functions scan-report (Phase 2)  │
└──────────────────────────────┘        └──────────────────────────────────┘
```

## Frontend

- **Screens** (`src/app`) only render and collect input.
- **Hooks** (`src/hooks/queries.ts`) wrap every read and write in React Query, so lists
  refresh after each save.
- **Services** (`src/services`) are the only code that talks to storage. The `Backend` interface
  has two implementations: `supabase.ts` (real) and `demo/` (on-device sample data). Screens never
  know which one is in use.
- **Logic** (`src/lib`) has no UI: the schedule engine turns medicines into due doses, the summary
  builder makes the vet PDF, notifications schedules phone reminders.

## Backend

- No custom server. The app calls Supabase directly with the user's session.
- Security lives in the database: every table checks `pet_members` for the caller's role
  (owner / editor / viewer). See [backend/README.md](../backend/README.md).
- Schema changes are new files in `backend/supabase/migrations/`, applied in order.
- Every table has `updated_at` and `deleted_at`, ready for offline sync.

## Data model

```
pets ─┬─ origins (1:1)
      ├─ conditions ──┐
      ├─ allergies    │
      ├─ visits ◀─────┤ linked by condition_id
      │    ├─ medicines ── dose_logs
      │    └─ reports
      └─ pet_members ── users (profiles)
```

## Phase 2: AI report scanning

1. App uploads the photo or PDF to `pet-files` and creates a `reports` row.
2. Edge Function `scan-report` checks access, sends the file to a vision AI model and asks for
   strict JSON (visit, medicines, vaccines, lab values, confidence).
3. The function validates the result and saves it to `reports.extracted`, unconfirmed.
4. The owner reviews pre-filled forms; confirming creates visits and medicines.

The AI key stays in the Edge Function, never in the app.
