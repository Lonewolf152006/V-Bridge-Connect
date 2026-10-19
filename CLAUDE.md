# Claude / Cursor Project Instructions — VBridgeConnect

## Project Overview
VBridgeConnect is a Next.js 16 (App Router) institutional collaboration and project governance platform for universities (specifically VIT).
Full documentation is in `AI_PROJECT_CONTEXT.md` and `PROJECT_SUMMARY_FOR_AI.md`.

## Key Commands
```bash
# Development (inside next-app/)
cd next-app
npm run dev

# High-speed Turbopack development
npm run dev:turbo

# Production Build & Start
npm run build
npm run start

# Testing
npm run test

# Prisma ORM
npx prisma generate
npx prisma db push
```

## Architecture & Code Conventions
- **App Router Structure**: All routes are under `next-app/src/app/`.
- **API Endpoints**: REST endpoints are under `next-app/src/app/api/v1/`.
- **UI Components**: Reusable primitives live in `next-app/src/components/common/`.
- **Global State**: Managed via Zustand in `next-app/src/store/appStore.ts`.
- **Database**: PostgreSQL hosted on Supabase (Prisma client singleton in `next-app/src/lib/db/prisma.ts`).
- **Styling**: Tailwind CSS v4. Primary color is Indigo `#4F46E5`.

## Non-Negotiable Directives
1. **Never use external avatar APIs**: Do NOT use `api.dicebear.com`. Use the local `<InitialsAvatar name={name} />` component.
2. **Immutable Submissions**: Resubmissions must create a new version row; never overwrite prior submission rows.
3. **Role Scoping**: Industry Partners must not have access to student GPAs, institutional grades, or faculty-private remarks.
4. **Code Splitting**: Heavy modules like `xlsx` or PDF engines must be imported dynamically (`const XLSX = await import('xlsx')`).
5. **Always maintain error and loading fallbacks**: Keep `loading.tsx`, `error.tsx`, and `not-found.tsx` functional.
