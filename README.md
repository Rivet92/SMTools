# SMTools

[![CI](https://github.com/rivet92/SMTools/actions/workflows/ci.yml/badge.svg)](https://github.com/rivet92/SMTools/actions/workflows/ci.yml)
[![Deploy](https://github.com/rivet92/SMTools/actions/workflows/deploy.yml/badge.svg)](https://github.com/rivet92/SMTools/actions/workflows/deploy.yml)
[![codecov - backend](https://img.shields.io/codecov/c/github/rivet92/SMTools?flag=backend&label=backend)](https://codecov.io/gh/rivet92/SMTools)
[![codecov - frontend](https://img.shields.io/codecov/c/github/rivet92/SMTools?flag=frontend&label=frontend)](https://codecov.io/gh/rivet92/SMTools)

Herramientas ágiles para facilitar las ceremonias de tu equipo: **Planning Poker**, **Retrospectivas**, y mucho más. Empieza a usarlas en segundos. Backend en .NET 10 (Minimal APIs) + frontend en React 19 con Vite y TypeScript. Autenticación OAuth (Google, GitHub) y base de datos PostgreSQL.

## Índice

- [Documentación](#documentación)
- [Arquitectura](#arquitectura)
- [AGENTS.md](AGENTS.md) — guía interna para asistentes de IA

## Documentación

- [**Desarrollo**](docs/development.md) — requisitos, setup, comandos, URLs, migraciones, code splitting, OAuth
- [**Despliegue**](docs/deployment.md) — CI/CD, secrets de GitHub, VPS, Docker, proxy inverso, logs

## Arquitectura

Monorepo con **pnpm**. El backend .NET está dividido por bounded contexts (no Clean Architecture):

| Proyecto | Schema PostgreSQL | Responsabilidad |
|----------|-------------------|-----------------|
| `SMTools.Api` | `audit` | Composition root, routes, middleware, auditoría |
| `SMTools.Abstractions` | — | Interfaces compartidas, value objects, `RoomHubBase` |
| `SMTools.Identity` | `identity` | Usuarios y sesiones |
| `SMTools.Notes` | `notes` | Notas CRUD |
| `SMTools.PlanningPoker` | `planningpoker` | Salas, decks, votaciones |
| `SMTools.Retro` | `retro` | Salas, tarjetas, columnas, plantillas |
| `SMTools.Kanban` | `kanban` | Tableros, columnas, tarjetas |

Endpoints con **Minimal APIs** (sin controladores). Comunicación en tiempo real vía **SignalR** (`/hubs/planning-poker`, `/hubs/retro`, `/hubs/kanban`). Autenticación con cookies + OAuth.

El frontend sigue **feature-sliced** bajo `frontend/src/features/<name>/`, con Zustand para estado cliente, React Query para estado servidor y MUI v6 (`sx` prop, sin CSS modules ni Tailwind).
