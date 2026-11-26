# Audit, 2026-11-26

Scope: dependency audit, code review of auth/CORS/rate limiting, test baseline. Backend and frontend.

## Fixed in this change
- bcrypt 5 to 6 (drops the vulnerable tar / node-pre-gyp chain; critical + high advisories). API unchanged, hash/compare verified.
- package-lock.json is now committed and the Dockerfile uses `npm ci`, so builds are reproducible.
- `npm audit --omit=dev`: 0 vulnerabilities.

## Open findings (backend)
- Tests: none. `npm test` is a placeholder. Planned: integration tests next (Nov 27).
- Dev-only: 2 moderate advisories (nodemon via minimatch). nodemon is not used by any script; remove it or upgrade.
- No input validation on register/login (missing fields, password length, email format). Missing password currently returns 500.
- JWT payload embeds the full user record (email, profile fields). Prefer a minimal payload (user id).
- `req.user` is typed `any`; `src/utils/jwt.ts` is an empty file.
- GET /v1/shelf routes are unauthenticated by design; confirm they expose only public data.
- Auth error handling matches on error message strings.
- Architecture: controllers, models and services are mixed (controllers call models directly in places). Planned for Nov 30.

## Frontend
- `npm audit`: 0 vulnerabilities. 15 unit tests (Vitest) pass. No coverage report and no API-level integration tests yet.
- `App.tsx` is about 480 lines and mixes UI, state and API calls. Planned split (Nov 29).
- Major versions available but not taken: React 19, MUI 9, Tailwind 4. Upgrade separately, with tests first.

## Not in scope here
- Secrets in old git history are a known hygiene item and are not addressed by this change.
- Database migration and the free DB expiry (2026-12-20) are handled separately.
