# AGENTS.md

Persistent instructions for AI coding agents working on this project.

## Project Overview

This is a Vietnamese family tree web application built with:

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Node.js 20+

The app includes public family pages, member/profile pages, analytics,
news/events/memories pages, login, and an admin area protected by signed session
cookies.

## Critical Next.js Rule

This project uses Next.js 16, which has breaking changes compared with older
Next.js versions. Do not rely only on memory from older Next.js releases.

Before writing code that depends on Next.js behavior, read the relevant guide in:

```bash
node_modules/next/dist/docs/
```

Pay attention to current conventions such as `src/proxy.ts` replacing older
middleware patterns.

## Behavioral Guidelines

These guidelines reduce common LLM coding mistakes. They bias toward caution
over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

Do not assume, do not hide confusion, and surface tradeoffs.

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them. Do not pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop, name what is confusing, and ask.

### 2. Simplicity First

Write the minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No flexibility or configurability that was not requested.
- No error handling for impossible scenarios.
- If 200 lines could be 50, simplify.

### 3. Surgical Changes

Touch only what is necessary. Clean up only your own changes.

When editing existing code:

- Do not improve adjacent code, comments, or formatting unless required.
- Do not refactor things that are not broken.
- Match existing style, even if you would do it differently.
- If you notice unrelated dead code, mention it instead of deleting it.

When your changes create orphans:

- Remove imports, variables, and functions that your changes made unused.
- Do not remove pre-existing dead code unless asked.

Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

Define success criteria and verify them.

Examples:

- "Add validation" means write tests for invalid inputs, then make them pass.
- "Fix the bug" means reproduce it, then make the fix pass verification.
- "Refactor X" means ensure tests pass before and after where practical.

For multi-step tasks, use a brief plan:

```text
1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]
```

## Working Rules

- If the user asks for a code review, only review. Do not edit files.
- If the user asks to implement or fix something, keep the change scoped to the
  requested behavior.
- Do not rewrite large areas of the app unless the user explicitly asks for a
  redesign or refactor.
- Preserve the existing visual style unless the task is specifically about UI
  redesign.
- Do not remove user changes or reset the git worktree.
- Do not use destructive git commands such as `git reset --hard` or
  `git checkout --` unless the user explicitly requests them.
- Prefer existing local patterns, helpers, and components over introducing new
  abstractions.
- Keep TypeScript strict and avoid `any` unless there is a clear reason.
- Do not hard-code secrets, passwords, tokens, or production credentials.
- Never commit real `.env.local` values.
- Keep production data on the server/database, not in `localStorage`.
- For user-facing Vietnamese text, keep the tone consistent with the current app.

## Commands

Use these commands from the `family-tree-app` directory:

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
npm run test:smoke
```

Recommended checks after code changes:

- Small UI/text-only change: `npm run lint`
- Shared logic or auth change: `npm run lint`, `npm test`, `npm run build`
- Routing/auth/admin change: `npm run lint`, `npm test`, `npm run build`, smoke test
- Dependency change: `npm run build`, `npm test`, `npm audit --omit=dev`

The smoke test requires a running production server and env values:

```bash
npm run build
PORT=3100 npm run start
node --env-file=.env.local scripts/smoke.mjs http://localhost:3100
```

Stop the server after testing.

## Environment

Required environment variables:

```bash
AUTH_SECRET=
AUTH_ADMIN_USERNAME=
AUTH_ADMIN_PASSWORD=
DATABASE_URL=
```

Rules:

- `AUTH_SECRET` must be at least 32 characters.
- Production secrets must be generated securely.
- Admin password must not be shown in the UI or committed.
- Local database uses Docker Postgres from `docker-compose.yml`.
- Use `.env.example` as the public template.

## Architecture Notes

Important files and areas:

- `src/lib/auth.ts`: signed session token creation, validation, credential checks
- `src/lib/safe-redirect.ts`: redirect sanitization
- `src/lib/db.ts`: database client/helper layer
- `src/lib/rate-limit.ts`: rate limiting helpers
- `src/lib/request-auth.ts`: request authentication helpers
- `src/proxy.ts`: protects `/admin*`
- `src/app/api/auth/login/route.ts`: login API
- `src/app/api/auth/logout/route.ts`: logout API
- `src/app/admin/page.tsx`: admin dashboard
- `src/data.json`: static seed/fallback family tree data
- `src/lib/family-data.ts`: data access helpers
- `prisma/schema.prisma`: database schema
- `prisma/seed.ts`: seed data
- `scripts/smoke.mjs`: HTTP smoke test

## Auth And Security Rules

- Session cookies must remain `httpOnly`.
- Use `secure: true` in production cookies.
- Signed session tokens must not accept unsigned Base64 JSON payloads.
- Keep token validation strict: role enum, valid `issuedAt`, expiration, and
  signature verification.
- Do not add open redirects. Use `safeRedirectPath`.
- Login responses must not reveal whether username or password failed.
- Add or update tests when changing auth behavior.
- Use rate limiting for auth and write APIs.
- Use CSRF protection for sensitive writes.

For real production, single-admin env-based auth is not enough by itself.
Prefer one of:

- A real identity provider
- A database-backed user system with password hashing using bcrypt or argon2

Production auth should also include password reset/change flow, role-based
access control, and audit logs.

## Data And Persistence Rules

- Do not store important admin actions only in `localStorage`.
- Do not treat `src/data.json` as the source of truth for live production data.
- Use the database for production CRUD.
- Design migrations and backups before storing family records.
- Keep member IDs stable because profile routes depend on them.
- Validate all server input before saving.

Recommended production data areas:

- Members
- Family relationships
- Spouses/children
- Profile images
- Events
- News posts
- Memories/media
- Admin approval requests
- Audit logs

## UI And Product Rules

- Maintain responsive behavior across mobile and desktop.
- Avoid adding inactive buttons that only show demo toasts unless the user asks
  for prototype UI.
- If a feature is presented as real, it must have real behavior.
- Keep forms accessible with labels, validation states, and useful errors.
- Keep images optimized through the existing image approach.
- Do not add external image domains without updating `next.config.ts`.

## Testing Expectations

When changing behavior, update or add focused tests.

Important coverage areas:

- Auth token signing and tamper rejection
- Login failure and success paths
- Admin route protection
- Safe redirects
- Family data integrity
- Profile route generation
- API write validation
- Rate limiting and CSRF behavior

For production-facing changes, prefer testing the actual route or workflow, not
only isolated helpers.

## Production Readiness Checklist

Do not describe the app as production-ready unless these are handled:

- Production build passes
- Lint passes
- Unit tests pass
- Smoke test passes
- `npm audit --omit=dev` has no unresolved critical/high issues
- Real database exists for live data
- Admin actions persist on the server
- Auth is production-grade
- Rate limiting exists for auth and write APIs
- CSRF protection exists for sensitive writes
- File/image upload storage is defined
- Backups and restore process are defined
- Logging and audit trail exist
- Error monitoring is configured
- Privacy and data access rules are defined
- Prototype/demo text and fake actions are removed or clearly marked

## Review Style

When reviewing code:

- Lead with findings ordered by severity.
- Include exact file and line references.
- Focus on bugs, security risks, regressions, missing persistence, missing tests,
  and production blockers.
- Keep summaries brief.
- If there are no issues, say that clearly and mention residual risk.
