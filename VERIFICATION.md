# Phase 1 verification

Verified on 4 October 2026 with Node.js 24.19.0 on Windows and a workspace-local PostgreSQL 18.4 instance.

- Prisma client generation and schema formatting succeeded.
- The initial SQL migration applied successfully to an empty PostgreSQL database.
- Strict TypeScript checks passed for both apps.
- ESLint passed.
- Both production builds passed.
- The real-database auth integration test passed, including input validation, duplicate email handling, bcrypt hashing, login, JWT protection, safe user responses, malformed JSON, CORS, Helmet headers, and rate limiting.
- Started both apps together with `npm run dev`.
- Browser verified: unauthenticated dashboard redirects to login; registration opens the empty dashboard; refresh retains the session; theme toggle survives refresh; sign out returns to login; a wrong password shows an error; valid login restores the dashboard.
- Checked the narrow sidebar and desktop layout. Fixed the closed mobile sidebar so its links are not keyboard-accessible while hidden.
- No browser console warnings or errors were reported in the final check.

The current local preview uses an isolated PostgreSQL process on port 55432 and ignored local `.env` files. The generated JWT secret is local-only. The PostgreSQL helper and database data are in the workspace's `work/verification` directory, outside the deliverable project. For a fresh setup or after stopping that process, follow the README using your own PostgreSQL instance or the supplied Docker Compose file and copy the environment examples again.

A local browser test account (`phase1-browser@example.test`, password `phase1-test-password`) was created only in this verification database. This is not the requested demo seed; that remains Phase 5 work. You can register your own account in the running preview.

## Dependency audit limitation

The install audit reported nine high-severity dependency findings, including transitive findings through Prisma CLI configuration (`deepmerge-ts`, `effect`) and Tailwind 3 build tooling (`braces`, `micromatch`, `chokidar`, `fast-glob`). `npm audit --omit=dev` still reports four through Prisma's optional CLI peer dependency. These have not been represented as fixed. React Router was updated to 7.18.4 to resolve its reported advisories. The app is a Phase 1 local development foundation, not a production deployment sign-off. Revisit the affected dependency chains before deployment; do not run `npm audit fix --force` without reviewing its proposed Prisma downgrade and Tailwind major-version changes.

No Phase 2 business functionality, real-time events, XP awards, or seed data were implemented.
