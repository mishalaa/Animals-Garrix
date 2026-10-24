# PetPassport

A pet health record app for cats, dogs and more: identity and origin story, medical history,
vet visits, medicines with reminders, stored reports, and a one-page vet summary.
English and Bangla. One codebase runs on the web now and on Android and iOS later.

"PetPassport" is a working name. Change it in `frontend/app.json` and `frontend/src/i18n/*.ts`.

## Project layout

```
petpassport/
├── frontend/   Expo app (React Native + TypeScript) for web, Android and iOS
├── backend/    Supabase database schema, security rules, tests, Edge Functions
├── docs/       architecture and feature notes
└── package.json   shortcuts to run both from the root
```

- [frontend/README.md](frontend/README.md): app structure, screens, running and building
- [backend/README.md](backend/README.md): database, access rules, setting up Supabase
- [docs/architecture.md](docs/architecture.md): how the pieces fit together
- [docs/features.md](docs/features.md): full feature list

## Quick start

Requires Node 20+.

```bash
npm run setup        # installs frontend and backend dependencies
npm run web          # opens the app in the browser
npm run test:backend # checks the database security rules
```

With no Supabase keys the app runs in **demo mode** with three sample pets stored on the
device. To use a real backend, follow [backend/README.md](backend/README.md) and add your keys
to `frontend/.env.local`.

## Root commands

| Command                | What it does                                       |
| ---------------------- | -------------------------------------------------- |
| `npm run setup`        | Install dependencies in `frontend/` and `backend/` |
| `npm run web`          | Start the app in the browser                       |
| `npm run start`        | Start the dev server (scan the QR with Expo Go)    |
| `npm run typecheck`    | Type-check the app                                 |
| `npm run build:web`    | Build the web version into `frontend/dist`         |
| `npm run test:backend` | Run the database permission tests                  |
| `npm run format`       | Format all code with Prettier                      |

This app keeps owner records. It does not give medical advice.
