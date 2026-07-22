# syntax=docker/dockerfile:1

# -------------------------
# Stage 1: Build frontend
# -------------------------
FROM node:22-alpine AS frontend-build
WORKDIR /src

# Install pnpm with a fixed version
RUN npm install -g pnpm@9.15.0

# Copy workspace/package files and fetch dependencies for better layer caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY frontend/package.json ./frontend/
RUN pnpm fetch
RUN pnpm install --frozen-lockfile --offline

# Copy frontend source and build
COPY frontend/ ./frontend/
ARG BASE_URL=/
ENV BASE_URL=${BASE_URL}
RUN pnpm --filter frontend build

# -------------------------
# Stage 2: Build backend
# -------------------------
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS backend-build
WORKDIR /src

COPY SMTools.slnx ./
COPY backend/Directory.Build.props ./backend/
COPY backend/Directory.Packages.props ./backend/
COPY backend/src/SMTools.Abstractions/*.csproj ./backend/src/SMTools.Abstractions/
COPY backend/src/SMTools.Identity/*.csproj ./backend/src/SMTools.Identity/
COPY backend/src/SMTools.Notes/*.csproj ./backend/src/SMTools.Notes/
COPY backend/src/SMTools.PlanningPoker/*.csproj ./backend/src/SMTools.PlanningPoker/
COPY backend/src/SMTools.Retro/*.csproj ./backend/src/SMTools.Retro/
COPY backend/src/SMTools.Kanban/*.csproj ./backend/src/SMTools.Kanban/
COPY backend/src/SMTools.Api/*.csproj ./backend/src/SMTools.Api/
RUN dotnet restore backend/src/SMTools.Api/SMTools.Api.csproj

COPY backend/ ./backend/
RUN dotnet publish backend/src/SMTools.Api/SMTools.Api.csproj \
    -c Release \
    -o /app/publish

# -------------------------
# Stage 3: Runtime image
# -------------------------
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runtime
WORKDIR /app
EXPOSE 8080

# Copy entrypoint and set permissions before dropping to appuser
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod 755 /app/docker-entrypoint.sh

# Create a non-root user and set ownership
RUN adduser -D -h /app -g '' appuser && chown -R appuser /app
USER appuser

# Runtime configuration (overridable via environment variables)
ENV PORT=8080
ENV ASPNETCORE_URLS=http://+:${PORT}
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1

# Copy published backend
COPY --from=backend-build --chown=appuser /app/publish .

# Copy built frontend into wwwroot so the backend serves it
COPY --from=frontend-build --chown=appuser /src/frontend/dist ./wwwroot

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider "http://localhost:${PORT}/health/ready" || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
