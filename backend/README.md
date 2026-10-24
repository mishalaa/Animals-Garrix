# PetPassport backend

Supabase (Postgres + Auth + Storage). There is no custom server: the app talks to Supabase
directly, and security is enforced inside the database with Row Level Security.

## Layout

```
backend/
├── supabase/
│   ├── migrations/                      applied in filename order
│   │   ├── 20261019000001_helpers_and_profiles.sql   profiles, updated_at trigger
│   │   ├── 20261019000002_pets_and_sharing.sql       pets, pet_members, share_pet()
│   │   ├── 20261019000003_health_records.sql         origins, conditions, allergies,
│   │   │                                              visits, medicines, dose_logs, reports
│   │   ├── 20261019000004_row_level_security.sql     who can read / write what
│   │   └── 20261019000005_storage.sql                private pet-files bucket
│   └── functions/                       Edge Functions (Phase 2: scan-report)
├── tests/
│   └── rls.test.mjs                     permission tests (in-memory Postgres)
└── package.json
```

## Access model

Every record belongs to a pet. Each pet has members in `pet_members`:

| Role   | Read | Add / edit records | Rename pet | Share | Delete pet |
| ------ | ---- | ------------------ | ---------- | ----- | ---------- |
| owner  | ✓    | ✓                  | ✓          | ✓     | ✓          |
| editor | ✓    | ✓                  | ✓          |       |            |
| viewer | ✓    |                    |            |       |            |

Files are stored as `pet-files/<pet_id>/<file>` and follow the same rules.

## Set up a project

1. Create a project at [supabase.com](https://supabase.com).
2. Apply the migrations, either:
   - **SQL Editor:** paste and run each file in `supabase/migrations/` in order, or
   - **CLI:** `npx supabase init` (keep the existing `migrations/` folder),
     `npx supabase link --project-ref <ref>`, then `npm run db:push`.
3. Copy the project URL and anon key into `frontend/.env.local` (see `frontend/.env.example`).

## Test the security rules

```bash
npm install
npm test
```

Runs the migrations in an in-memory Postgres and checks 17 rules, for example that a stranger
cannot see a pet, a viewer cannot add records, and an editor cannot delete a pet.

## Adding a change

Create a new file in `supabase/migrations/` with a later timestamp, for example
`20261101000000_add_expenses.sql`. Never edit a migration that has already been applied to a
live project. Add a test to `tests/rls.test.mjs` for any new table.
