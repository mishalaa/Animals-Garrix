# PetPassport backend

Supabase (Postgres + Auth + Storage). There is no custom server: the app talks to Supabase
directly, and security is enforced inside the database with Row Level Security.

## Layout

```
backend/
├── supabase/
│   ├── config.toml                      Supabase CLI config (local + link)
│   ├── migrations/                      applied in filename order
│   │   ├── 20261019000001_helpers_and_profiles.sql   profiles, updated_at trigger
│   │   ├── 20261019000002_pets_and_sharing.sql       pets, pet_members, share_pet()
│   │   ├── 20261019000003_health_records.sql         origins, conditions, allergies,
│   │   │                                              visits, medicines, dose_logs, reports
│   │   ├── 20261019000004_row_level_security.sql     who can read / write what
│   │   └── 20261019000005_storage.sql                private pet-files bucket
│   └── functions/                       Edge Functions (Phase 2: scan-report)
├── scripts/                             link + baseline helpers
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

## Connect Supabase from the terminal (recommended)

One-time setup from the **repo root** (or run the same scripts inside `backend/`):

```bash
cd backend
cp .env.example .env          # set SUPABASE_PROJECT_REF (already set if you cloned this repo)
npm install                   # installs the Supabase CLI locally
npm run supabase:login        # opens browser; signs the CLI in
npm run supabase:link         # links backend/ to your cloud project
npm run db:baseline           # only if schema was applied via SQL Editor before using CLI
```

Put app keys in `frontend/.env.local` (see `frontend/.env.example`).

### Day-to-day commands

| Command | What it does |
| ------- | ------------ |
| `npm run db:status` | Show which migrations are applied on the linked project |
| `npm run db:push` | Apply **new** migration files to the linked cloud database |
| `npm run db:new -- <name>` | Create a new timestamped file under `supabase/migrations/` |
| `npm run test` | Run RLS tests locally (no cloud needed) |

From the repo root you can use the same names (`npm run db:push`, etc.) — they forward to `backend/`.

### CI or non-interactive login

Create a token at [Account → Access Tokens](https://supabase.com/dashboard/account/tokens) and set:

```bash
set SUPABASE_ACCESS_TOKEN=your_token   # Windows CMD
$env:SUPABASE_ACCESS_TOKEN="your_token" # PowerShell
```

Then `npm run supabase:link` and `npm run db:push` work without `supabase login`.

### Fresh cloud project (never used SQL Editor)

Skip `db:baseline`. After `supabase:link`, run:

```bash
npm run db:push
```

That applies all files in `supabase/migrations/` in order.

### Already applied schema in the dashboard (your case)

If tables already exist from the SQL editor (without using the CLI), run **`db:baseline` once** after linking.
It tells Supabase those migration versions are already applied so `db:push` will not try to recreate tables.

After that, only add **new** migration files and run `db:push`.

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
live project. Add a test to `tests/rls.test.mjs` for any new table. Then:

```bash
npm run db:push
```
