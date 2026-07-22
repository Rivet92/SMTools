# AGENTS.md

## Table of Contents

- [Architecture](#architecture)
- [Dev Commands](#dev-commands)
- [Backend](#backend)
- [Frontend](#frontend)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Deployment](#deployment)
- [Adding a New Bounded Context](#adding-a-new-bounded-context)
- [Conventions](#conventions)
- [Common Pitfalls](#common-pitfalls)

---

## Architecture

- **pnpm monorepo**: root `package.json` + `backend/` (`.NET 10`, multi-project) + `frontend/` (Vite + React 19).
- `pnpm-workspace.yaml` lists only `frontend` as a workspace package; `backend/` is a sibling, not in the workspace.
- **Backend architecture**: modular by bounded context (not Clean Architecture). Each bounded context is its own project with its own DbContext, services, hubs, DTOs, and validation. There is no separate Application/Domain/Infrastructure layer — the composition root is `SMTools.Api`.
- **Backend projects** (7 modules under `backend/src/`):
  - `SMTools.Api` — composition root, web host, routes, middleware, `AuditDbContext`, shared infrastructure
  - `SMTools.Abstractions` — shared kernel: interfaces, value objects, `RoomHubBase<TRoom, TParticipant, TState, TDbContext>`, `RoomServiceBase<TRoom, TParticipant, TRepository>`, `IRoomEndpointHandler<...>`, generic exceptions (`NotFoundException<T>`, `BusinessRuleException`)
  - `SMTools.Identity` — auth bounded context: users, sessions, `IdentityDbContext`
  - `SMTools.Notes` — notes bounded context: CRUD, `NotesDbContext`
  - `SMTools.PlanningPoker` — planning poker bounded context: rooms, decks, votes, `PlanningPokerDbContext`
  - `SMTools.Retro` — retro bounded context: rooms, cards, columns, templates, `RetroDbContext`
  - `SMTools.Kanban` — kanban bounded context: boards, columns, cards, `KanbanDbContext`
- Each module DbContext uses its own PostgreSQL schema (`identity`, `notes`, `planningpoker`, `retro`, `kanban`). Audit logs live in the `audit` schema via `AuditDbContext` in `SMTools.Api`.
- All module projects use `Microsoft.NET.Sdk.Web` with `<OutputType>Library</OutputType>` — they reference ASP.NET Core types without being executable hosts. Only `SMTools.Api.csproj` has `<InternalsVisibleTo>SMToolsBackend.Tests</InternalsVisibleTo>`.
- **Minimal APIs** (no controllers). Endpoints are `RouteGroupBuilder` extension methods in `backend/src/SMTools.Api/Routes/`. Each bounded context's routes are registered via a generic `MapCommonRoomEndpoints<T>` that resolves `IRoomEndpointHandler` through DI, eliminating per-module lambda duplication.
- **SignalR** (backend): `PlanningPokerHub` at `/hubs/planning-poker`, `RetroHub` at `/hubs/retro`, `KanbanHub` at `/hubs/kanban`. All inherit from `RoomHubBase<TRoom, TParticipant, TState, TDbContext>` which injects `IUnitOfWork<TDbContext>` for transactional persistence in `JoinRoom`, `ReconnectParticipantAsync`, and `UpdateRoomPassword`. All three hubs use partial classes to split responsibilities (`.Votes.cs`, `.Cards.cs`, etc.). Proxied by Vite with WebSocket support.
- **Cross-context events**: planned but not implemented. The goal is MediatR integration events (`IIntegrationEvent`) in `SMTools.Abstractions`. Currently neither the package nor the interface exist. Re-evaluate in ITERACION4.
- **Frontend**: feature-sliced under `src/features/<name>/` — see [Frontend](#frontend) section.

---

## Dev Commands

All commands run from repo root.

### Database

| Command | Description |
|---|---|
| `pnpm dev:db` | `docker compose up -d db` (PostgreSQL only) |
| `pnpm db:add-migration <Name>` | `dotnet ef migrations add --project backend/src/SMTools.Api/SMTools.Api.csproj` |
| `pnpm db:update` | `dotnet ef database update --project backend/src/SMTools.Api/SMTools.Api.csproj` |

### Development servers

| Command | Description |
|---|---|
| `pnpm kill:ports` | Kill processes on ports 5125 (backend) and 8080 (frontend) |
| `pnpm dev` | `docker compose up -d`, then backend + frontend concurrently |
| `pnpm dev:backend` | `dotnet watch --project backend/src/SMTools.Api/SMTools.Api.csproj` |
| `pnpm dev:frontend` | `pnpm --filter frontend dev` |
| `pnpm down` | Stop Docker services |

### Build & quality

| Command | Description |
|---|---|
| `pnpm lint` | `pnpm --filter frontend lint` |
| `pnpm typecheck` | `pnpm --filter frontend typecheck` |
| `pnpm format:check` | `dotnet format backend/src/SMTools.Api/SMTools.Api.csproj --verify-no-changes` |
| `pnpm format:fix` | `dotnet format backend/src/SMTools.Api/SMTools.Api.csproj` |
| `pnpm build:backend` | `dotnet publish backend in Release mode` |
| `pnpm clean` | Remove `dist`, `node_modules`, `.turbo` |

### Testing

| Command | Description |
|---|---|
| `pnpm test` | Backend + frontend tests |
| `pnpm test:backend` | `dotnet test tests/SMToolsBackend.Tests/SMToolsBackend.Tests.csproj` |
| `pnpm test:frontend` | `pnpm --filter frontend test` |
| `pnpm test:e2e` | Playwright E2E tests (headless) |
| `pnpm test:e2e:ui` | Playwright E2E tests with UI mode |
| `pnpm test:coverage` | Full coverage report (backend + frontend) |

### Docker

| Command | Description |
|---|---|
| `pnpm docker:build` | `docker build -t smtools:latest .` |
| `BASE_URL=/app pnpm docker:build:base` | Build with a subpath base URL |
| `pnpm docker:run` | `docker run --env-file .env -p 8080:8080 smtools:latest` |

### Frontend-specific

| Command | Description |
|---|---|
| `pnpm --filter frontend dev` | Vite dev server on `:8080` (strictPort) |
| `pnpm --filter frontend build` | `tsc -b && vite build` |
| `pnpm --filter frontend lint` | `eslint .` |
| `pnpm --filter frontend format` | `prettier --write .` |
| `pnpm --filter frontend format:check` | `prettier --check .` |
| `pnpm --filter frontend generate-types` | Regenerate `src/types/generated/api.ts` from `openapi.snapshot.json` |

### Solution file

`SMTools.slnx` at repo root includes all 7 projects under `backend/src/` plus the test project `tests/SMToolsBackend.Tests/`.

---

## Backend

### Cross-cutting services

| Service | File | Description |
|---|---|---|
| `EnvLoader` | `.../Setup/EnvLoader.cs` | Walks up from CWD looking for `.env`. Only active in `Development`. No third-party dotenv library. |
| `Serilog` | `.../Setup/LoggingSetup.cs` | Full Serilog pipeline; compact JSON formatter in production, text template in development. Disabled in `Testing` env. |
| `ExceptionHandlingMiddleware` | `.../Middleware/ExceptionHandlingMiddleware.cs` | Global exception handler returning RFC 7807 `ProblemDetails`. Maps `DomainException`, `ForbiddenException`, `KeyNotFoundException`, `UnauthorizedAccessException`. |
| `SecurityHeadersMiddleware` | `.../Middleware/SecurityHeadersMiddleware.cs` | CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `X-Permitted-Cross-Domain-Policies`. |
| `RateLimiterSetup` | `.../Setup/RateLimiterSetup.cs` | Two policies: `AuthenticatedUserPolicy` (200 req/min) and `PublicPolicy` (20 req/min). |
| `PostgresHealthCheck` | `.../Setup/PostgresHealthCheck.cs` | Custom `IHealthCheck` probing PostgreSQL via `SELECT 1`. Mapped at `/health/live` and `/health/ready`. |
| `MasterDataCache` | `.../Setup/MasterDataCache.cs` | Singleton caching `PlanningPokerDeckDto` and `RetroTemplateResponse` with 1-hour TTL. |
| `SoftDeletePurgeService` | `.../Data/SoftDeletePurgeService.cs` | `BackgroundService` that runs daily and purges soft-deleted records. |
| `AuditInterceptor` | `.../Data/AuditInterceptor.cs` | `SaveChangesInterceptor` capturing entity changes across all contexts. `UserSession` excluded. The `IDbContextFactory<IdentityDbContext>` path (used by `DatabaseTicketStore`/`SessionCleanupBackgroundService`) omits the interceptor by design. |

### Auth endpoints

| Endpoint | Description |
|---|---|
| `POST /api/auth/avatar` | Upload avatar, resized to 128x128 with SixLabors.ImageSharp |
| `PUT /api/auth/profile` | Update display name and avatar URL |
| `GET /api/auth/export` | Export all user data (profile, notes, room memberships, votes, retro/kanban cards, comments) as JSON |
| `DELETE /api/auth/account` | Delete user and all associated data across modules |
| `POST /api/auth/test-login` | Development-only: creates/logs in an E2E test user |

### Audit API

`GET /api/audit` — paginated, filterable by action/entityType. Returns the current user's audit entries.

### DI registration

Each module registers its own services, DbContexts, validators, and hubs in `Setup/{Module}ServiceExtensions.cs` within its project. `SMTools.Api/Setup/ApplicationServiceExtensions.cs` orchestrates those calls and registers cross-cutting services (audit, rate limiting, cache, SignalR with `DomainExceptionHubFilter`, health checks, hosted services, CORS, external auth).

### Migrations

Apply automatically on startup (`ApplyMigrationsWithRetry`: up to 10 retries, 2s delay each, to wait for PostgreSQL).

### Seed data

Loaded from embedded JSON resources in `backend/src/SMTools.Api/Data/Seed/` (decks, retro-templates) via `DbInitializer.SeedAsync` — not via EF Core `HasData()`.

### API docs

- `/scalar/v1` (Scalar UI) — Development only.
- `/openapi/v1.json` — available in Development and Testing (used by CI for contract check and snapshot dump).

### OpenAPI snapshot (frontend type generation)

```bash
ASPNETCORE_ENVIRONMENT=Testing dotnet run --project backend/src/SMTools.Api/SMTools.Api.csproj -- --dump-openapi=openapi.snapshot.json
pnpm --filter frontend generate-types
```

The `contract` CI job blocks drift if `api.ts` is out of sync with the backend.

---

## Frontend

### Architecture

- **Feature-sliced**: every feature lives under `src/features/<name>/` with subdirectories:
  - `pages/` — routable page components only (one component per file)
  - `components/` — UI components specific to the feature (one component per file)
  - `hooks/` — custom hooks encapsulating feature logic or state
  - `store/` — Zustand stores for client state shared across the feature
  - `types/` — domain types (when not in `src/types/models/`)
- **State management**: Zustand (client) + `@tanstack/react-query` (server). No persistence except `localStorage` for theme. `authStore` was removed; auth is managed via `auth/hooks/useCurrentUser.ts` with react-query.
- **Styling**: MUI v6 with `sx` prop only. No CSS modules, no Tailwind. Icons from `@tabler/icons-react`.
- **Auth**: cookie-based via backend. OAuth (Google, GitHub). Frontend sets `credentials: 'include'` on all API calls.
- **i18n**: translations as static JSON files in `public/translations/{en,es-ES}.json` + `public/translations/languages.json`. Loaded via React Query (`fetchTranslations`/`fetchLanguages` in `src/api/i18n.ts`). Supported languages: `en`, `es-ES`. Files are served statically, not bundled.

### Features and routed pages

| Feature | Routed pages |
|---|---|
| `auth` | `LoginPage`, `ProfilePage` |
| `error` | `NotFoundPage` |
| `kanban` | `KanbanLobbyPage`, `KanbanBoardPage`, `KanbanParticipantsPage`, `KanbanBoardConfigPage`, `KanbanCardPage`, `KanbanCardCommentsPage` |
| `landing` | `LandingPage`, `LegalPage` |
| `menu` | `MainMenuPage` |
| `notes` | `NotesPage` |
| `planning-poker` | `PlanningPokerLobbyPage`, `PlanningPokerRoomPage`, `PlanningPokerResultsPage`, `PlanningPokerParticipantsPage` |
| `retro` | `RetroPage`, `RetroRoomPage`, `RetroParticipantsPage` |

Core features bundled in the entry chunk (defined in `coreFeatures` set in `vite.config.ts`): `auth`, `error`, `i18n`, `landing`, `layout`, `menu`, `seo`, `theme`.

### Shared components (under `src/components/`)

| Path | Contents |
|---|---|
| `room-lobby/` | `LobbyPage`, `RoomListTable`, `RoomListFilters`, `RoomLoadingState`, `ConfirmDialog`, `DeleteRoomDialog`, `RequireRoomPassword`, types, `useRoomListFilters`, `formatRoomDate` |
| `room-participants/` | `ParticipantsManager` |
| `room-header/` | `RoomHeader` |
| `error/` | `RootErrorBoundary`, `FeatureErrorBoundary` |
| `feedback/` | `SnackbarProvider`, `PasswordSettingsDialog` |
| `markdown/` | `MarkdownEditor`, `MarkdownPreview`, `MarkdownToolbar`, types, `useMarkdownInsert` |

### Shared hooks (under `src/hooks/`)

`useDebounce`, `useRoomCreator`, `useMyRooms`, `useDeleteRoomMutations`, `useRoomAdminActions`, `useRequireRoomPassword`, `getErrorMessage`, `makeRoomAction`

### API layer (under `src/api/`)

`client.ts` provides generic `apiGet/Post/Put/Delete` helpers with `ApiError` and `ProblemDetails` parsing. Feature-specific API modules: `kanban.ts`, `notes.ts`, `planning-poker.ts`, `retro.ts`, `i18n.ts`.

### SignalR frontend architecture

- **`createHubConnection`** (`src/hubs/createHubConnection.ts`) — base factory for SignalR connections. Handles lifecycle, auto-reconnect with exponential backoff (1s, 2s, 5s, 10s, 30s), and common events (`RoomUpdated`, `RoomClosed`, `YouWereRemoved`).
- **`createFeatureHub`** (`src/hubs/createFeatureHub.ts`) — wrapper adding `guardedInvoke` (error handling) and `requireRoom` (room context assertion).
- **Feature hubs**: `planningPokerHub.ts`, `retroHub.ts`, `kanbanHub.ts` use the factory for feature-specific interactions.
- **Delta updates** (PlanningPoker only): version-based state sync via `handleDelta`. Checks `version <= store.lastVersion` and requests full state if a version is skipped. Kanban and Retro use full-state updates.

### Store patterns

- **`createRoomStore`** (`src/stores/createRoomStore.ts`) provides `createBaseRoomSlice` — a Zustand slice factory used by all three room-based stores (kanban, retro, planning-poker).
- All room stores track `lastVersion`. The `setRoom` action includes a version guard: `if (state.room && room.version <= state.room.version) return {}`.
- Test utility: `renderWithProviders.tsx` wraps components with QueryClient, i18n, Theme, and Router.

### Code splitting

`vite.config.ts` uses `manualChunks` to group each `src/features/<name>/` into its own chunk, except core features (listed above) which stay in the entry chunk. Routed pages under tool features are loaded via `React.lazy()`.

### Tooling

- **TypeScript**: `tsc -b` using project references (`tsconfig.json` → `tsconfig.app.json`, `tsconfig.node.json`). Enforced flags: `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUnusedLocals`, `noUnusedParameters`.
- **Vite**: `envDir: '..'` loads env files from repo root; frontend vars must be prefixed with `VITE_`. Proxies `/api`, `/avatars`, `/scalar`, `/openapi`, and `/hubs` (WebSocket) to `localhost:5125`. Dev server hardcoded to port `8080`.
- **Formatting**: Prettier (config in `frontend/.prettierrc`). CI enforces via `format:check`.
- **External dependencies**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (drag-and-drop), `react-markdown` (markdown rendering), `@microsoft/signalr` (SignalR client).

---

## Testing

| Layer | Framework | Location |
|---|---|---|
| Backend (unit/integration) | xUnit, FluentAssertions, NSubstitute, `WebApplicationFactory` | `tests/SMToolsBackend.Tests/` |
| Frontend (unit) | Vitest (jsdom, globals) | Co-located `__tests__/` dirs next to source |
| E2E | Playwright | `frontend/e2e/` |

The backend test project references all 7 module projects directly. A minimal `.editorconfig` under `backend/` suppresses analyzer warnings in generated migration files.

For coverage: `pnpm test:coverage` produces a combined report (backend + frontend).

---

## CI/CD

### Workflows (`.github/workflows/`)

| Workflow | Trigger | Actions |
|---|---|---|
| `ci.yml` | Pull request | Build backend + frontend, lint, format check, typecheck, all tests, code coverage, OpenAPI contract check |
| `deploy.yml` | Push to `main` | Verify, build Docker image, push to GHCR, deploy to VPS |
| `e2e.yml` | Push / PR | E2E tests with real PostgreSQL service |

---

## Deployment

- **Production**: backend serves the frontend SPA from `wwwroot/`. The Dockerfile copies `frontend/dist` into `backend/wwwroot` and builds a single container image.
- **Production compose**: `deploy/docker-compose.yml` includes health checks and an avatars volume.
- **Backup scripts**: `backups/backup.sh` and `backups/restore.sh` for PostgreSQL. Configuration via `backups/.env.example`.
- **Production env vars**: `deploy/.env.example` provides the template.

---

## Adding a New Bounded Context

1. Create a new project under `backend/src/SMTools.<Module>/` using `<Project Sdk="Microsoft.NET.Sdk.Web">` with `<OutputType>Library</OutputType>`.
2. Add the project reference to `SMTools.slnx`.
3. Create the module's DbContext with its own PostgreSQL schema in `Data/<Module>DbContext.cs`.
4. Register the DbContext and services in `Setup/<Module>ServiceExtensions.cs`.
5. Add the module registration call in `SMTools.Api/Setup/ApplicationServiceExtensions.cs`.
6. Create routes in `SMTools.Api/Routes/<Module>Endpoints.cs`. Register via `MapCommonRoomEndpoints<T>` if the module follows the room pattern.
7. Create the frontend feature folder under `src/features/<module>/` with pages, components, hooks, store, and types.
8. If the feature uses SignalR, create a hub inheriting from `RoomHubBase<...>` in the backend and use `createFeatureHub` in the frontend.
9. If the feature requires real-time state, wire up the Zustand store using `createBaseRoomSlice` from `createRoomStore.ts`.
10. Add E2E tests in `frontend/e2e/<module>.spec.ts`.

---

## Conventions

### TypeScript

- Named exports everywhere. Only `App` and `i18n/config` may use default exports.
- One component per file, one hook per file.
- Prefer local component state. Use Zustand only for state shared across the feature or app.
- Use `@tanstack/react-query` for all server state (fetching, caching, mutations).
- Do not create a global `src/components/` folder for feature-specific UI. Add shared components there only when at least two unrelated features need them.

### C&#35;

- File-scoped namespaces.
- `sealed` classes for services and models.
- Records for DTOs, request, and response types.
- `JsonIgnore` on navigation properties.
- `FluentValidation` with `WithValidation<T>()` extension on endpoints.

### Component guidelines

Split a component when:
- it exceeds ~200 lines,
- it mixes UI rendering with business logic that can be extracted to a hook,
- it renders multiple independent sections (e.g., sidebar + editor + dialogs).
- after every change, make sure README.md and AGENTS.md stay updated.

---

## Common Pitfalls

- `pnpm dev` runs `docker compose up -d` automatically. If Docker is not running, PostgreSQL (and therefore the backend) will fail.
- Frontend OAuth callback URLs must use port `8080` (via Vite proxy) when registering with Google/GitHub for local dev: `http://localhost:8080/api/auth/callback/{google|github}`.
- Environment variables live in `.env` at repo root (gitignored). Copy `.env.example` and fill values. Do not commit development secrets to `appsettings.Development.json`.
- `/tools/planning-poker` (`PlanningPokerLobbyPage`), `/tools/retro` (`RetroPage`, `RetroRoomPage`), and `/tools/kanban` (`KanbanLobbyPage`, `KanbanBoardPage`, `KanbanBoardConfigPage`, `KanbanCardPage`, `KanbanCardCommentsPage`) are fully implemented (backend + frontend). `/tools/notes` also has full implementation.
