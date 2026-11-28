# Testing & Detailed Bug Report — Khela Hobe

- **Target Repository:** `pointfex-hq/-Khela-Hobe`
- **Branch Tested:** `main` (`0106dfb`)
- **Report Date:** 2026-11-28
- **Related Issue:** [#6 — Testing and detailed Bug Report](https://github.com/pointfex-hq/-Khela-Hobe/issues/6)
- **Author:** Neela Haque (`nilasha.nil.3040@gmail.com`)

---

## 1. Executive Summary

Build verification, static analysis, Prisma schema validation, frontend–backend API contract auditing, unit checks on match eligibility helpers, and code-level functional auditing were conducted across both the React/Vite frontend (`src/`) and the Next.js/Prisma backend (`backend/`).

- **Builds & Typechecking:** Both the frontend (`vite build`) and backend (`tsc --noEmit`, `next build`) compile cleanly once dependencies are installed and required Prisma environment variables (`DATABASE_URL`, `DIRECT_URL`) are provided.
- **Automated Test Coverage:** No automated unit, integration, or E2E test suite currently exists in the repository (`package.json` and `backend/package.json` define no `test` script; `backend/tests/` referenced by `docker-compose.yml` does not exist).
- **Defects Identified:** **12 verified bugs** (4 High, 6 Medium, 2 Low) spanning persistence gaps, broken UI interactions, missing backend routes, container/environment misconfiguration, authorization gaps, and pagination/state bugs.

---

## 2. Test Environment & Scope

| Item | Details |
| :--- | :--- |
| **OS** | Windows |
| **Node.js** | `v26.13.1` |
| **Frontend Stack** | React `18.3.1`, Vite `5.4.21`, React Router `6.28.0`, Tailwind CSS `3.4.16`, Zustand `5.1.0` |
| **Backend Stack** | Next.js `16.4.6` (Turbopack), Prisma `6.19.3`, TypeScript `5.7.2`, Zod `3.23.8`, ioredis `6.1.0` |
| **In Scope** | Frontend & backend production builds, TypeScript check, Prisma schema validation, API route-to-service parity audit (110 backend endpoints vs. 144 frontend service calls), eligibility helper unit checks, and code-level functional review |
| **Out of Scope / Blocked** | Live database integration tests, SSLCommerz sandbox checkout callbacks, Google OAuth live redirects, and Docker container startup (no live PostgreSQL/Redis `.env`, no `docker` CLI, and `backend/Dockerfile` is missing) |

---

## 3. Test Execution Summary

| Test ID | Check / Suite | Command / Method | Outcome | Notes / Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Frontend dependency install & production build | `npm ci --prefer-offline && npm run build` | **PASS** (with warning) | 1,336 modules transformed and built in `26.01s`. Warning: `dist/assets/index-DyeBi3c9.js` is `2,527.12 kB` (>500 kB chunk limit). |
| **TC-02** | Backend Prisma schema validation (without `.env`) | `npx prisma validate` | **FAIL** | `Error P1012: Environment variable not found: DIRECT_URL` (`backend/prisma/schema.prisma:11`). |
| **TC-03** | Backend Prisma schema validation (with env vars) | `DATABASE_URL=... DIRECT_URL=... npx prisma validate` | **PASS** | Schema validated (`Prisma CLI v6.19.3`). |
| **TC-04** | Backend TypeScript strict typecheck | `npx tsc --noEmit` | **PASS** | Exited with code `0` (`strict: true`, `noUnusedLocals`, `noUnusedParameters`). |
| **TC-05** | Backend Next.js production build | `npx next build` | **PASS** (with warnings) | Compiled in `11.8s`; TypeScript finished in `17.1s`; 110 `/api/v1/*` routes built. Warnings: multiple lockfiles detected; `middleware` file convention deprecated in Next.js 16. |
| **TC-06** | Frontend–backend API contract audit | Cross-checked `src/services/endpoints/*.js` against `backend/src/app/api/v1/**/route.ts` | **FAIL** (2 gaps) | 142 of 144 service calls matched backend routes; 2 endpoints missing (`GET /analytics/organizer`, `GET /tickets/:param`). |
| **TC-07** | Match eligibility unit verification | Node verification of `src/utils/matchEligibility.js` | **PASS** (7/7) | Verified `ADMIN` bypass, organizer own-match bypass, `GIRLS_ONLY` male rejection / female acceptance, missing age rejection, below-`minAge` rejection, and `minAge` boundary acceptance. |
| **TC-08** | Automated test suite discovery | Repository scan for `test` scripts and `*.test.*` / `*.spec.*` files | **NOT AVAILABLE** | Zero automated test suites exist (`backend/prisma/seed-test-data.mjs` is a manual DB seed script). |
| **TC-09** | Docker Compose & live E2E smoke test | Inspected `backend/docker-compose.yml` and local environment | **BLOCKED** | `backend/Dockerfile` and `backend/tests/` do not exist; `docker` CLI is not installed; no `.env` or live PostgreSQL/Redis configured. |

---

## 4. Detailed Bug Reports

### BUG-01 — Quick Match participant check-in API does not persist check-in state
- **Severity:** High | **Priority:** P1 | **Component:** Backend / Match Check-In
- **Location:** `backend/src/app/api/v1/matches/[id]/participants/[participantId]/check-in/route.ts` (L28–L45)
- **Steps to Reproduce:**
  1. As a match organizer, send `POST /api/v1/matches/{id}/participants/{participantId}/check-in`.
  2. Observe the `200 OK` response containing `checkedIn: true`.
  3. Refresh the match participant list (`GET /api/v1/matches/{id}/participants`).
- **Expected Result:** The participant's attendance/check-in state is persisted in PostgreSQL (`MatchParticipant`) and reflected on subsequent reads.
- **Actual Result:** The route only queries `prisma.matchParticipant.findFirst(...)` and returns `{ ...toParticipantDto(participant), checkedIn: true }` without executing any `prisma.matchParticipant.update(...)` write.
- **Root Cause:** Missing database update call (and corresponding persisted check-in field/status transition) in `check-in/route.ts`.

---

### BUG-02 — Quick Match "Gate Pass" routes to Tournament Tickets and does not issue a match pass
- **Severity:** High | **Priority:** P1 | **Component:** Frontend & Backend / Quick Match Passes
- **Related Issue:** [#3 — Get Pass of a joined quick match doesn't work](https://github.com/pointfex-hq/-Khela-Hobe/issues/3)
- **Location:**
  - `src/pages/player/PlayerMyMatchesPage.jsx` (L23–L27, L33, L102, L147–L151)
  - `backend/src/app/api/v1/matches/[id]/join/route.ts`
- **Steps to Reproduce:**
  1. Join a Quick Match as a player.
  2. Open `/player/my-matches`.
  3. Inspect the tab labels, match list, and click **Gate Pass** on any match card.
- **Expected Result:** The page displays only matches the player joined/organized with accurate dynamic counts, and **Gate Pass** displays or issues a valid one-time pass/code for that Quick Match that the organizer can verify until the match ends.
- **Actual Result:**
  1. `PlayerMyMatchesPage.jsx` fetches all public matches (`matchService.getMatches()`) instead of the player's own joined matches (`/users/:id/matches`).
  2. Tab labels are hardcoded (`Upcoming Matches (2)`, `Confirmed Passes (1)`, `Match History (19)`), and `matches.slice(0, activeTab === 'past' ? 4 : 2)` renders arbitrary public matches regardless of participation.
  3. Clicking **Gate Pass** navigates to `ROUTES.PLAYER_TICKETS` (`/player/tickets`), which only shows tournament spectator `Ticket` records. Neither `join/route.ts` nor `MatchParticipant` generates or stores a quick-match pass/OTP.
- **Root Cause:** `PlayerMyMatchesPage` uses a placeholder public-match slice and redirects to tournament ticketing; quick-match pass issuance and verification are not implemented.

---

### BUG-03 — Weekly Availability, Privacy toggles, and Photo Removal fail on Edit Athlete Profile
- **Severity:** High | **Priority:** P1 | **Component:** Frontend & Backend / Player Profile Edit
- **Related Issue:** [#7 — Unreponsive feature on my profile edit section](https://github.com/pointfex-hq/-Khela-Hobe/issues/7)
- **Location:**
  - `src/pages/player/PlayerEditProfilePage.jsx` (L144–L147, L204–L226, L590–L656)
  - `src/services/endpoints/profileService.js` (L6–L54)
  - `backend/src/app/api/v1/users/me/route.ts` (L20–L36)
- **Steps to Reproduce:**
  1. Navigate to `/player/profile/edit`.
  2. Click any checkbox under **Weekly Availability (BST)** or **Privacy & Visibility** (`Show general area only`, `Hide phone number until match accepted`).
  3. Alternatively, click **Remove** on the profile photo and click **Save Changes**.
- **Expected Result:** Clicking checkboxes toggles their checked state cleanly and persists changes on save; clicking **Remove** clears the saved profile photo.
- **Actual Result:**
  1. **Unresponsive Checkboxes:** Each checkbox uses `<label onClick={...}>` wrapping a `<input type="checkbox" readOnly />`. Clicking the `<label>` triggers `onClick` once directly and a second time when the browser dispatches a synthetic click to the associated `<input>` that bubbles back up to `<label>`, toggling the boolean twice and leaving the UI unchanged.
  2. **Silent Data Loss on Save:** `onSubmit` in `PlayerEditProfilePage.jsx`, `buildUpdateProfilePayload` in `profileService.js`, and `updateMeSchema` in `users/me/route.ts` all omit `weeklyAvailability` and `privacy`.
  3. **Photo Removal Not Saved:** `handleRemovePhoto` sets `avatarUrl` to `''`, and `onSubmit` checks `if (avatarUrl && !avatarUrl.startsWith('blob:'))`, so `profileImageUrl: null` is never sent.
- **Root Cause:** Double-fired `<label onClick>` handler on wrapped checkboxes, plus missing fields in frontend payload builder and backend Zod/Prisma update schema.

---

### BUG-04 — Backend Docker Compose setup is broken out of the box
- **Severity:** High | **Priority:** P1 | **Component:** DevOps / Backend Configuration
- **Location:**
  - `backend/docker-compose.yml` (L24, L31–L33, L40)
  - `backend/prisma/schema.prisma` (L10–L11)
  - `backend/src/lib/auth.ts` (L9), `backend/src/middleware.ts` (L11)
- **Steps to Reproduce:**
  1. Run `docker compose up --build` inside `backend/`.
- **Expected Result:** The backend container builds, connects to PostGIS, validates Prisma schema, and boots cleanly.
- **Actual Result:**
  1. `build.dockerfile: Dockerfile` references `backend/Dockerfile`, which does not exist.
  2. Volume mount `./tests:/app/tests` references `backend/tests`, which does not exist.
  3. Environment variables set `SESSION_SECRET` and `FRONTEND_ORIGIN`, whereas the backend code reads `JWT_SECRET`, `CORS_ORIGIN`, and `FRONTEND_URL`.
  4. `DIRECT_URL` is required by `prisma/schema.prisma` (`P1012` error when missing) but is omitted from `docker-compose.yml`.
- **Root Cause:** `docker-compose.yml` is out of sync with the Next.js/Prisma backend files and environment contract.

---

### BUG-05 — Payment initiation allows unauthenticated requests for Tournament & Ticket flows
- **Severity:** Medium | **Priority:** P1 | **Component:** Backend / Payments Security
- **Location:** `backend/src/app/api/v1/payments/sslcommerz/init/route.ts` (L34, L119–L177)
- **Steps to Reproduce:**
  1. Send `POST /api/v1/payments/sslcommerz/init` without an `Authorization` header or session cookie, specifying `purpose: "TOURNAMENT_FEE"` and a valid `registrationId` (or `purpose: "GENERAL"`).
- **Expected Result:** Payment initiation requires an authenticated user (and verifies ownership of the `registrationId`) or explicitly restricts guest checkout.
- **Actual Result:** `verifySession(request)` is checked only inside the `if (purpose === 'MATCH_FEE')` branch (L72); `TOURNAMENT_FEE`, `EVENT_TICKET`, and `GENERAL` proceed with `session === null`, allowing unauthenticated callers to create `PaymentTransaction` records against any `registrationId`.
- **Root Cause:** Missing session/ownership guard outside the `MATCH_FEE` branch.

---

### BUG-06 — Hardcoded fallback JWT secret in backend authentication library
- **Severity:** Medium | **Priority:** P1 | **Component:** Backend / Security
- **Location:** `backend/src/lib/auth.ts` (L9)
- **Steps to Reproduce:**
  1. Start the backend without `JWT_SECRET` defined in the environment.
  2. Inspect `JWT_SECRET` in `backend/src/lib/auth.ts`.
- **Expected Result:** The server refuses to sign/verify tokens or throws a startup configuration error in production when `JWT_SECRET` is unset.
- **Actual Result:** Falls back to `'super-secret-jwt-key-change-in-production-123456789'`, which is committed in public source control and allows anyone to forge valid access and refresh tokens if `JWT_SECRET` is misconfigured.
- **Root Cause:** Unconditional hardcoded fallback string on `process.env.JWT_SECRET`.

---

### BUG-07 — Frontend calls two unimplemented backend endpoints (`GET /analytics/organizer`, `GET /tickets/:id`)
- **Severity:** Medium | **Priority:** P2 | **Component:** Frontend–Backend API Contract
- **Location:**
  - `src/services/endpoints/analyticsService.js` (L7)
  - `src/services/endpoints/ticketService.js` (L32–L35)
  - `backend/src/app/api/v1/tickets/` (missing `[id]/route.ts`), `backend/src/app/api/v1/analytics/` (missing)
- **Steps to Reproduce:**
  1. Sign in as an Organizer in live API mode (`VITE_USE_MOCK_API=false`) and open `/organizer/dashboard`.
  2. Or invoke `ticketService.getTicketDetails(ticketId)`.
- **Expected Result:** `GET /api/v1/analytics/organizer` returns organizer attendance/sport breakdown data and `GET /api/v1/tickets/:id` returns ticket details.
- **Actual Result:** Both routes return `404 Not Found`. `analyticsService.getOrganizerAnalytics` catches the error and returns empty arrays, causing Organizer Dashboard charts to render empty in live mode.
- **Root Cause:** Backend route handlers for `/api/v1/analytics/organizer` and `/api/v1/tickets/[id]` were never implemented.

---

### BUG-08 — `organizerService.getOrganizerDashboard` spreads string `userId` into query parameters
- **Severity:** Medium | **Priority:** P2 | **Component:** Frontend / Organizer Dashboard
- **Location:**
  - `src/services/endpoints/organizerService.js` (L5–L26)
  - `src/services/endpoints/matchService.js` (L109–L115)
- **Steps to Reproduce:**
  1. Open `/organizer/dashboard` while authenticated.
  2. Inspect the outgoing `GET /api/v1/matches/mine` network request query string.
- **Expected Result:** `getMyCreatedMatches` receives an options object (if any) and `pendingApps` reflects actual pending match applications.
- **Actual Result:** `organizerService.getOrganizerDashboard(user?.id)` passes a string (`user?.id`) as `extraParams` to `matchService.getMyCreatedMatches('all', organizerId)`, which does `{ status: 'ALL', ...extraParams }` — spreading string character indices (`0=c&1=m&...`) onto the query string. Additionally, `pendingApps: 0` and `pendingAlert: null` are hardcoded.
- **Root Cause:** Signature mismatch between `organizerService.getOrganizerDashboard` and `matchService.getMyCreatedMatches`.

---

### BUG-09 — `ExploreMatchesPage` mixes server-side pagination with client-side filtering
- **Severity:** Medium | **Priority:** P2 | **Component:** Frontend / Match Discovery
- **Location:**
  - `src/pages/public/ExploreMatchesPage.jsx` (L97–L112, L147–L186, L222–L225)
  - `src/services/endpoints/matchService.js` (L14–L90)
- **Steps to Reproduce:**
  1. Open `/explore` in Grid view with `> 8` active matches in the database.
  2. Apply a `Date`, `Availability` (`Open Slots Only`), or `Search` filter.
- **Expected Result:** Filtering and eligibility checks happen before pagination so each page has up to 8 matching items and `totalMatchesCount` / `totalPages` accurately reflect filtered results.
- **Actual Result:** `GET /matches` only accepts `sportId`, `city`, `status`, `skillLevel`, and eligibility; `matchService.getMatches` and `ExploreMatchesPage` then filter `location`, `date`, `availability`, and `search` client-side on that single 8-item slice while still using the unfiltered server `totalElements` and `totalPages`. Pages can appear partially empty or completely empty while showing `Showing X of Y`.
- **Root Cause:** Client-side post-filtering applied after server-side pagination without forwarding `q` / `from` / `to` / `openSlots` or recalculating totals.

---

### BUG-10 — `OrganizerProfilePage` shows `Edit Profile` on public profiles and drops `organization` on save
- **Severity:** Medium | **Priority:** P2 | **Component:** Frontend / Organizer Profile
- **Location:** `src/pages/organizer/OrganizerProfilePage.jsx` (L98–L121, L161–L168, L190–L193, L373–L381)
- **Steps to Reproduce:**
  1. Visit another organizer's public profile at `/organizers/{organizerId}`.
  2. Or open your own organizer profile, click **Edit Profile**, change **Organization / Club**, and save.
- **Expected Result:** Public organizer profiles hide **Edit Profile**, reflect actual verification status, and saving updates `organization` and global auth user state.
- **Actual Result:**
  1. **Edit Profile** renders even when `organizerId` is present (public view).
  2. **Verified Organizer** badge renders unconditionally regardless of `profile?.isVerifiedOrganizer` or `organizerApprovalStatus`.
  3. `onEditSubmit` omits `organization` from the PATCH payload and does not call `updateUserState(res.data)`.
- **Root Cause:** Missing `!organizerId` ownership guard on header actions/badge and incomplete payload/state update in `onEditSubmit`.

---

### BUG-11 — `CreateQuickMatchPage` edit mode does not hydrate `selectedCity`, `selectedArea`, or `selectedVenueId`
- **Severity:** Low | **Priority:** P3 | **Component:** Frontend / Match Editing
- **Location:** `src/pages/organizer/CreateQuickMatchPage.jsx` (L41–L43, L111–L162, L240–L248)
- **Steps to Reproduce:**
  1. Create a match in a city/area other than `Dhaka` (e.g., `Sylhet`).
  2. Open `/organizer/matches/{matchId}/edit` and save any unrelated change (e.g., title).
- **Expected Result:** Existing `city`, `area`, and `venueId` are preserved when editing a match.
- **Actual Result:** The edit-mode `useEffect` resets `form` fields (`title`, `venue`, etc.) and `pinnedLat`/`pinnedLng`, but never updates `selectedCity` (defaults to `'Dhaka'`), `selectedArea` (`''`), or `selectedVenueId` (`''`). Submitting overwrites `location.city` with `'Dhaka'`.
- **Root Cause:** Missing `setSelectedCity`, `setSelectedArea`, and `setSelectedVenueId` calls in the match hydration `useEffect`.

---

### BUG-12 — `PATCH /api/v1/matches/[id]` ignores `isQuickMatchHostAllowed` authorization result
- **Severity:** Low | **Priority:** P3 | **Component:** Backend / Match Authorization
- **Location:** `backend/src/app/api/v1/matches/[id]/route.ts` (L179)
- **Steps to Reproduce:**
  1. Inspect `PATCH` handler in `backend/src/app/api/v1/matches/[id]/route.ts`.
- **Expected Result:** If a host's privilege was revoked or unverified (`!hostCheck.allowed`), `PATCH` returns `403`, or the unused check is removed if ownership check alone is intended.
- **Actual Result:** `const hostCheck = await isQuickMatchHostAllowed(existing.organizerId, session.roles);` is executed and its return value is never inspected.
- **Root Cause:** Incomplete authorization check left in the `PATCH` handler.

---

## 5. Additional Observations & Warnings

- **Bundle Size Warning:** Frontend production bundle `dist/assets/index-DyeBi3c9.js` is `2.53 MB` (`693 kB` gzip) because routes and heavy dependencies (`jspdf`, `leaflet`, `html5-qrcode`, `recharts`) are eagerly bundled without `React.lazy` route splitting.
- **Next.js 16 Middleware Deprecation:** `backend/src/middleware.ts` triggers a build warning that the `middleware` convention is deprecated in favor of `proxy`.
- **Missing ESLint Configuration in Backend:** `backend/package.json` defines `"lint": "next lint"`, which has no `.eslintrc*` or `eslint.config.*` committed in `backend/`.
- **Open UX Issues Tracked Separately:** [#4](https://github.com/pointfex-hq/-Khela-Hobe/issues/4) (Global searchbar removal — addressed on `fix/remove-global-searchbar`) and [#10](https://github.com/pointfex-hq/-Khela-Hobe/issues/10) (Sign-out button placement in header vs. sidebar/profile).

---

## 6. Recommended Next Actions

1. **Fix Data Persistence & Auth Gaps First (P1):** Persist check-in state in `check-in/route.ts`, wire Quick Match Gate Pass generation/verification (#3), fix the double-toggle `<label onClick>` and persist `weeklyAvailability`/`privacy`/avatar-removal (#7), require session + ownership on `TOURNAMENT_FEE` payment init, and fail fast on missing `JWT_SECRET`.
2. **Repair Dev/CI Ergonomics:** Add `backend/Dockerfile`, include `DIRECT_URL` and aligned env variable names (`JWT_SECRET`, `CORS_ORIGIN`, `FRONTEND_URL`) in `backend/docker-compose.yml`, and commit an ESLint config for `backend/`.
3. **Close API Contract & Pagination Gaps (P2):** Implement `GET /api/v1/analytics/organizer` and `GET /api/v1/tickets/[id]`, fix `organizerService.getOrganizerDashboard` argument passing, and move `ExploreMatchesPage` date/search/availability filters to the backend query.
4. **Introduce Automated Tests:** Add Vitest + React Testing Library for frontend components/services and API route integration tests in `backend/tests/`.
