# Claude / Cursor Project Instructions — VBridgeConnect

## Project Overview
VBridgeConnect is a Next.js 16 (App Router) institutional collaboration and project governance platform for engineering universities (specifically VIT).
Full documentation is available in `../AI_PROJECT_CONTEXT.md` and `../PROJECT_SUMMARY_FOR_AI.md`.

## Key Commands
```bash
# Development
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
```

## Non-Negotiable Directives
1. **Never use external avatar APIs**: Do NOT use `api.dicebear.com`. Use the local `<InitialsAvatar name={name} />` component.
2. **Immutable Submissions (FR-052)**: Resubmissions must create a new version row; never overwrite prior submission rows.
3. **Role Scoping (FR-092)**: Industry Partners must not have access to student GPAs, institutional grades, or faculty-private remarks.
4. **Code Splitting**: Heavy modules like `xlsx` or PDF engines must be imported dynamically (`const XLSX = await import('xlsx')`).
5. **Always maintain error and loading fallbacks**: Keep `src/app/loading.tsx`, `src/app/error.tsx`, and `src/app/not-found.tsx` intact.
