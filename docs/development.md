# Desarrollo

## Requisitos

- [Docker](https://docs.docker.com/get-docker/)
- [Node.js](https://nodejs.org/) >= 22.0.0
- [pnpm](https://pnpm.io/installation) >= 9.0.0 (el campo `packageManager` de `package.json` lo activa automáticamente si usas Corepack)
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0) (solo para desarrollo local del backend)

## Configurar variables de entorno

```bash
cp .env.example .env
```

El backend cargará `.env` automáticamente cuando `ASPNETCORE_ENVIRONMENT=Development`. No pongas credenciales de desarrollo en `appsettings.Development.json`.

## Levantar los servicios

```bash
pnpm dev       # PostgreSQL + backend + frontend
pnpm down      # para todos los servicios
pnpm dev:db    # solo PostgreSQL
```

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | PostgreSQL + backend + frontend en paralelo |
| `pnpm dev:db` | Solo PostgreSQL |
| `pnpm dev:backend` | Solo backend (dotnet watch) |
| `pnpm dev:frontend` | Solo frontend (Vite) |
| `pnpm down` | Para todos los contenedores Docker |
| `pnpm lint` | ESLint en el frontend |
| `pnpm typecheck` | `tsc -b --noEmit` en el frontend |
| `pnpm format:check` | Verifica formato del backend (`.editorconfig`) |
| `pnpm format:fix` | Aplica formato al backend |
| `pnpm test` | Tests de backend + frontend |
| `pnpm test:backend` | Tests unitarios del backend (xUnit) |
| `pnpm test:frontend` | Tests unitarios del frontend (Vitest) |
| `pnpm test:e2e` | Tests E2E (Playwright) |
| `pnpm test:coverage` | Reporte de cobertura completo |
| `pnpm build:backend` | Compila el backend en Release |
| `pnpm clean` | Elimina `dist`, `node_modules`, `.turbo` |
| `pnpm docker:build` | Construye la imagen Docker |
| `pnpm docker:run` | Ejecuta la imagen localmente |
| `pnpm db:add-migration <Name>` | Crea migración en SMTools.Api |
| `pnpm db:update` | Aplica migraciones pendientes |

## URLs de acceso

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:8080 |
| API (backend directo) | http://localhost:5125/api/planningpoker/decks |
| API (a través del frontend) | http://localhost:8080/api/planningpoker/decks |
| Scalar UI (backend directo) | http://localhost:5125/scalar/v1 |
| Scalar UI (a través del frontend) | http://localhost:8080/scalar/v1 |
| OpenAPI JSON | http://localhost:8080/openapi/v1.json |
| pgAdmin | http://localhost:5050 |

> **Nota:** pgAdmin requiere `PGADMIN_DEFAULT_EMAIL` y `PGADMIN_DEFAULT_PASSWORD` en tu `.env`. No son credenciales de la BD, sino del panel de pgAdmin.

## Generar tipos de la API

El frontend usa tipos TypeScript generados a partir del snapshot OpenAPI del backend (no en vivo):

```bash
pnpm --filter frontend generate-types
```

Esto regenera `frontend/src/types/generated/api.ts` desde `openapi.snapshot.json` (raíz del repo). Para actualizar el snapshot tras cambios en el backend:

```bash
ASPNETCORE_ENVIRONMENT=Testing dotnet run --project backend/src/SMTools.Api/SMTools.Api.csproj -- --dump-openapi=openapi.snapshot.json
pnpm --filter frontend generate-types
```

> El job `contract` en CI bloquea si `api.ts` no está sincronizado con el backend.

## Migraciones

Cada bounded context tiene su propio DbContext y migraciones independientes. Para crear una migración, usa el script específico del contexto:

```bash
pnpm db:add-migration:pp MigrationName   # PlanningPoker
pnpm db:add-migration:retro MigrationName # Retro
pnpm db:add-migration:kanban MigrationName # Kanban
pnpm db:add-migration:notes MigrationName  # Notes
pnpm db:add-migration:identity MigrationName # Identity
pnpm db:add-migration MigrationName        # Auditoría (SMTools.Api)
```

El backend aplica automáticamente las migraciones pendientes al arrancar (`ApplyMigrationsWithRetry`: hasta 10 reintentos con 2s de espera para que PostgreSQL esté listo).

## Code splitting del frontend

El frontend usa `React.lazy()` para cargar las páginas de cada herramienta bajo demanda. La configuración de `manualChunks` en `frontend/vite.config.ts` agrupa cada feature de `src/features/<nombre>/` en su propio chunk, salvo las features core que se cargan en el entry:

- `auth`
- `error`
- `i18n`
- `landing`
- `layout`
- `menu`
- `seo`
- `theme`

Si añades una nueva **herramienta** (ej. `features/wiki/`), no tienes que tocar la configuración: Vite creará un chunk `wiki-XXXX.js` automáticamente. Si añades una nueva **feature core** que deba cargarse en el entry, añádela al `Set` de `coreFeatures` en `frontend/vite.config.ts`.

## Autenticación OAuth 2.0

SMTools soporta inicio de sesión con Google y GitHub. Las sesiones se persisten en PostgreSQL mediante un almacén de tickets de cookies personalizado.

### Configurar Google

1. Ve a [Google Cloud Console](https://console.cloud.google.com/apis/credentials) y crea unas credenciales OAuth 2.0 para aplicación web.
2. Añade estos orígenes y URIs de redirección autorizados:
   - Orígenes autorizados: `http://localhost:8080` (desarrollo) y tu origen de producción.
   - URIs de redirección: `http://localhost:8080/api/auth/callback/google` y `https://TU_DOMINIO/api/auth/callback/google`.
3. Copia el **Client ID** y el **Client Secret**.

### Configurar GitHub

1. Ve a [GitHub Developer Settings](https://github.com/settings/developers) y registra una nueva OAuth App.
2. Como **Authorization callback URL** usa:
   - Desarrollo: `http://localhost:8080/api/auth/callback/github`
   - Producción: `https://TU_DOMINIO/api/auth/callback/github`
3. Copia el **Client ID** y el **Client Secret**.

### Variables de entorno OAuth

```env
Authentication__Google__ClientId=TU_GOOGLE_CLIENT_ID
Authentication__Google__ClientSecret=TU_GOOGLE_CLIENT_SECRET
Authentication__GitHub__ClientId=TU_GITHUB_CLIENT_ID
Authentication__GitHub__ClientSecret=TU_GITHUB_CLIENT_SECRET
```

> **Nota sobre desarrollo local:** durante el desarrollo todo el flujo OAuth circula por `http://localhost:8080` gracias al proxy de Vite. Registra las callback URLs con el puerto `8080` tanto en Google como en GitHub.
