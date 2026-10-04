# BugLife

> **"Because Every Project Has Bugs."**

A fast, real-time collaborative bug tracker with gamification designed for student and developer teams. Built with a clean developer-tool aesthetic (Linear/GitHub-inspired), strict server-side state machines, role-based access control, Socket.IO real-time synchronization, and an anti-abuse XP & achievement engine.

![BugLife Celebration](docs/screenshots/buglife-celebration.jpg)

---

## Tech Stack

* **Monorepo Architecture**:
  * `/client`: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, dnd-kit (Kanban drag-and-drop), Framer Motion, Recharts, socket.io-client, react-hook-form + Zod.
  * `/server`: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Socket.IO, JWT + bcrypt, Zod validation, Helmet, express-rate-limit, Multer (local disk uploads).
* **Tooling**: Strict TypeScript (`noImplicitAny`, strict mode), ESLint, Prettier, Concurrently.

---

## Features

* **Scroll-Tear Landing Page (`/`)**:
  * 5 immersive chapters: Hero Cover, 3D Flip Postcard with interactive flip animation, Shuffling Polaroids showcasing core features, Lifecycle Route Map visualizer, and interactive Postcard Feedback Form.
  * Warm paper design system tokens (`paper-warm`, `paper-torn`, `paper-stamp`, `stamp-border`).
  * Direct submissions to rate-limited backend endpoint `POST /api/feedback`.
  * Automatic redirect to `/dashboard` for logged-in users. Respects `prefers-reduced-motion`.
* **Scoped Team Connections Graph (`/connections`)**:
  * Pure SVG radial network graph (zero heavy external graph or D3-geo dependencies).
  * Deterministic concentric rings: Center (logged-in user), Ring 1 (direct collaborators), Ring 2 (shared projects), Ring 3 (extended team network).
  * Visual role badges: **Crown** for Project Owners, **ShieldCheck** for Reviewers, **Code** for Developers, **FolderGit2** for Projects, glowing pulse for the current user.
  * Live updates: listens for Socket.IO `connections:fix` events and merges into the TanStack Query cache without page refresh.
  * Accessible list/table view toggle and full keyboard navigation.
  * Filterable Recent Fixes panel (7d / 14d / 30d) with clickable links to bug details.
* **Multi-Tenant Security & Isolation**:
  * Connections graph API (`GET /api/connections`) enforces strict privacy boundaries: users only see peers and projects they actively share membership in.
  * Isolated user test account (`charlie@isolated.dev`) verifies zero cross-workspace data leakage.
* **Authentication & Profiles**:
  * Secure registration and login using JWT and bcrypt (cost factor 12).
  * Rate-limited auth routes (20 attempts / 15 mins).
  * Profile management and theme switcher (Dark mode default with persistent light mode option).
* **Projects & Roles**:
  * Role-based permissions: `OWNER`, `REVIEWER`, and `DEVELOPER`.
  * Atomic per-project bug numbering (e.g., `SD-1`, `SD-2`) handled within PostgreSQL transactions.
* **Bug Lifecycle & Strict Server-Side State Machine**:
  * Valid transitions:
    * `BACKLOG` $\rightarrow$ `TODO`
    * `TODO` $\rightarrow$ `IN_PROGRESS`, `BACKLOG`
    * `IN_PROGRESS` $\rightarrow$ `REVIEW`, `TODO`
    * `REVIEW` $\rightarrow$ `RESOLVED`, `REOPENED`, `IN_PROGRESS`
    * `RESOLVED` $\rightarrow$ `REOPENED`
    * `REOPENED` $\rightarrow$ `IN_PROGRESS`
  * Strict permission verification: Developers can progress bugs to `REVIEW`; only Reviewers and Owners can approve transitions to `RESOLVED`.
* **Interactive Kanban Board**:
  * Drag-and-drop powered by `@dnd-kit/core` & `@dnd-kit/sortable` with fractional position ordering and optimistic UI updates.
  * Automatic rollback with toast notifications if a transition is rejected by the server.
* **Real-Time Collaboration (Socket.IO)**:
  * Handshake authenticated with JWT.
  * Project-level (`project:<id>`) and user-level (`user:<id>`) rooms.
  * Live events update TanStack Query cache automatically: `bug:created`, `bug:updated`, `bug:assigned`, `bug:moved`, `bug:resolved`, `bug:reopened`, `comment:created`, `notification:new`, `achievement:unlocked`, `leaderboard:updated`, `connections:fix`.
* **Gamification & Anti-Abuse Engine**:
  * XP awarded on `REVIEW` $\rightarrow$ `RESOLVED` transitions:
    * Base XP: Low (10), Medium (20), High (35), Critical (50).
    * Speed bonuses: +10 XP if resolved within 24h, +25 XP if resolved within 1h.
    * Anti-abuse rules: No XP for self-approval, reporter == assignee, or re-resolving previously awarded bugs.
  * Dynamic levels ($L = \lfloor\sqrt{XP / 50}\rfloor + 1$) and titles (*Bug Rookie*, *Debugger*, *Bug Slayer*, *Bug Hunter*, *Bug Exterminator*, *Debugging Legend*).
  * Streaks & Achievements (*First Blood*, *Bug Slayer*, *Bug Exterminator*, *Critical Hit*, *On Fire*, *Speed Demon*).
  * "Bug Squashed" celebration modal with Framer Motion.
* **Analytics & Search**:
  * Real-time metrics and Recharts visualizations: resolution trends, bug distribution by priority/type/status, and member contributions.
  * Global search and `Ctrl+K` command palette for fast navigation.
  * Local file attachment support via Multer.

---

## Getting Started

### Prerequisites

* **Node.js**: 20.x, 22.x, or 24.x
* **PostgreSQL**: 16+ (or Docker Compose)

### 1. Installation

From the repository root:

```sh
npm install
```

### 2. Configure Environment Variables

Copy the example configuration files:

**PowerShell (Windows)**:
```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

**Bash (Linux / macOS)**:
```sh
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env` to configure your PostgreSQL connection string and JWT secret:
```env
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/buglife?schema=public"
JWT_SECRET="generate-a-random-32-character-secret"
CLIENT_ORIGIN="http://localhost:5173"
PORT=4000
NODE_ENV=development
```

### 3. Start PostgreSQL (Docker Compose)

A development-ready PostgreSQL configuration is included:

```sh
docker compose up -d --wait
```

### 4. Database Setup & Migrations

```sh
npm run db:generate
npm run db:migrate
```

### 5. Seed Demo Data

Run the database seed script to populate demo users, achievements, the **Sagar Drishti (SD)** project, sample bugs, and the isolated **Quantum Canvas (QC)** workspace:

```sh
npm run seed
```

**Seeded Demo Accounts** (Password for all: `password123`):
* `samar@demo.dev` (Project: **Sagar Drishti**, Role: **OWNER**)
* `rahul@demo.dev` (Project: **Sagar Drishti**, Role: **REVIEWER**)
* `aryan@demo.dev` (Project: **Sagar Drishti**, Role: **DEVELOPER**)
* `charlie@isolated.dev` (Project: **Quantum Canvas**, Role: **OWNER** - Isolated multi-tenant account)

---

## Development

Run both the backend API and frontend client concurrently:

```sh
npm run dev
```

* **Client**: [http://localhost:5173](http://localhost:5173)
* **Backend API**: [http://localhost:4000/api](http://localhost:4000/api)
* **API Health Check**: [http://localhost:4000/api/health](http://localhost:4000/api/health)

---

## Verification & Testing

Run all test suites and static analysis tools:

```sh
# Run all 6 test suites (Auth, Phase 2 lifecycle, Realtime, Gamification, Connections, Polish)
npm test

# Run individual test suites
npm run test:auth
npm run test:phase2
npm run test:realtime
npm run test:gamification
npm run test:connections
npm run test:polish

# Type-check both client and server workspaces
npm run typecheck

# Lint with ESLint
npm run lint

# Build production bundles for both client and server
npm run build
```

---

## Demo Walkthrough

### 1. Scroll-Tear Landing Page & Feedback
1. Navigate to [http://localhost:5173](http://localhost:5173) while logged out.
2. Experience the 5-chapter story: cover chapter with animated stamp badges, interactive 3D flip postcard, shuffling Polaroid cards, and the route map.
3. Scroll to Chapter 5 and fill out the postcard contact form to submit feedback directly to `POST /api/feedback`.

### 2. Multi-User Collaboration & Real-Time Sync
1. Open [http://localhost:5173](http://localhost:5173) in two separate browser windows (or incognito).
2. Log in as `samar@demo.dev` in Window 1 and `aryan@demo.dev` in Window 2.
3. In Window 1, create a **CRITICAL** bug assigned to **Aryan**.
4. Window 2 immediately receives a real-time notification via Socket.IO without page refresh.
5. In Window 2, drag the card on the Kanban board from **TO DO** $\rightarrow$ **IN PROGRESS** $\rightarrow$ **REVIEW**. Window 1 updates live.
6. In Window 1, approve the bug to **RESOLVED**.
7. Window 2 triggers the **"BUG SQUASHED"** celebration overlay (+50 XP, unlocks "Critical Hit"), and the leaderboard updates instantly.

### 3. Scoped Connections Radial Network
1. In Window 1 or 2, navigate to **Connections** (`/connections` or press `Ctrl+K` and type `Connections`).
2. View the pure SVG radial network with your avatar in the center, Sagar Drishti teammates in Ring 1, the SD project in Ring 2, and recent bug resolution pulses.
3. Switch to the accessible list view or filter fixes by 7, 14, or 30 days.
4. Log in as `charlie@isolated.dev` in a private window: Charlie's radial network only displays Charlie and Quantum Canvas (QC), proving strict multi-tenant privacy.
