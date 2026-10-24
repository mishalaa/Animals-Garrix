# PetPassport frontend

Expo SDK 58 app (React Native, Expo Router, TypeScript). The same code runs on the web,
Android and iOS.

## Run

```bash
npm install
npm run web        # browser
npm start          # dev server; scan the QR code with Expo Go on a phone
npm run typecheck
npm run format
```

Without `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
the app runs in demo mode with sample pets stored on the device.

## Folder structure

```
src/
├── app/                       Screens. Every file is a route (Expo Router).
│   ├── _layout.tsx            fonts, language, data and auth providers
│   ├── welcome.tsx            first screen
│   ├── sign-in.tsx            sign in / create account
│   └── (app)/                 everything behind sign-in
│       ├── _layout.tsx        auth guard, keeps phone reminders in sync
│       ├── (tabs)/            Home, Schedule, Profile + floating tab bar
│       └── pet/
│           ├── new.tsx        add a pet
│           └── [id]/          profile, edit, condition, allergy, visit,
│                              medicine, report, summary, share
├── components/
│   ├── ui/                    design system: Text, Layout, Header, Button, Chip,
│   │                          Form fields, Feedback, PetVisuals (import from '@/components/ui')
│   ├── common/                ListItem, LanguageSwitch
│   ├── forms/                 RecordForm: shared save / delete logic for record screens
│   ├── pet/                   PetCard, PetForm, BreedPicker, colour tones
│   │   └── tabs/              one file per profile tab + shared rows and helpers
│   └── schedule/              DoseItem (Done / Skip / Undo)
├── services/                  data access, chosen at startup
│   ├── backend.ts             the Backend interface every implementation follows
│   ├── supabase.ts            real backend
│   ├── demo/                  local backend (index.ts) and sample data (seed.ts)
│   └── index.ts               exports `api`: Supabase if configured, else demo
├── hooks/                     React Query hooks (queries.ts), usePetData
├── providers/                 AuthProvider
├── lib/                       pure logic: dates, schedule engine, reminders,
│                              vet-summary HTML, platform helpers
├── constants/                 breed list with health watch-points
├── i18n/                      en.ts, bn.ts
├── theme/                     colours, spacing, radius, shadow
└── types/                     row types mirroring the database
```

### Where to put new code

| You are adding…              | Put it in                                        |
| ---------------------------- | ------------------------------------------------ |
| A new screen                 | `src/app/…` (the file path is the URL)           |
| A reusable visual element    | `src/components/ui/` and export it in `index.ts` |
| A feature-specific component | `src/components/<feature>/`                      |
| A call to the database       | `src/services/backend.ts` + both implementations |
| A data hook for screens      | `src/hooks/queries.ts`                           |
| Logic with no UI             | `src/lib/`                                       |
| Text the user sees           | `src/i18n/en.ts` and `src/i18n/bn.ts`            |

Imports use the `@/` alias for `src/`, e.g. `import { Button } from '@/components/ui'`.

## Build for Android or iOS

Native folders are not committed; Expo generates them from `app.json`.

- Cloud build (no Android Studio needed): `npx eas-cli@latest build -p android --profile preview`
- Local build: `npx expo prebuild -p android`, then `cd android && ./gradlew assembleRelease`
