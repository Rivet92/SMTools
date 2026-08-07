# Despliegue

## Automatizado con CI/CD (GitHub Actions)

| Workflow | Evento | Descripción |
|----------|--------|-------------|
| `ci.yml` | PR a `main` | **Bloqueante.** Build, lint, formato, tests y verificación de contrato OpenAPI. |
| `deploy.yml` | Push a `main` (+ `workflow_dispatch`) | Build Docker → push a GHCR (tag inmutable `sha-<short>`) → deploy automático al VPS con `deploy.sh`. |
| `e2e.yml` | Push/PR a `main` | Tests E2E con Playwright + PostgreSQL. |

### Badges de cobertura

Los badges de cobertura del README se actualizan tras cada push a `main`. Para activarlos:

1. Ve a [codecov.io/gh](https://codecov.io/gh) e inicia sesión con GitHub.
2. Activa el repositorio `rivet92/SMTools`.
3. Codecov detectará automáticamente los flags `backend` (cobertura XML) y `frontend` (lcov.info).
4. Si Codecov requiere token, añade `CODECOV_TOKEN` en `Settings → Secrets and variables → Actions` de GitHub.

Los workflows ya incluyen el paso de subida con `fail_ci_if_error: false`, por lo que no bloquearán el CI aunque Codecov no esté configurado.

### Prerrequisitos en el VPS

El servidor debe tener instalado:

- **Docker** (v24+) y **Docker Compose** (v2+)
- **Git** (solo para clonar/verificar, no necesario en runtime)

Prepara el directorio y los archivos de configuración:

```bash
ssh usuario@vps
sudo mkdir -p /opt/smtools
sudo chown $USER:$USER /opt/smtools
```

Desde tu máquina local, copia los archivos de despliegue:

```bash
scp deploy/docker-compose.yml deploy/.env.example deploy/deploy.sh deploy/rollback.sh deploy/status.sh usuario@vps:/opt/smtools/
```

Luego en el VPS:

```bash
ssh usuario@vps
cd /opt/smtools
cp .env.example .env
chmod 755 deploy.sh rollback.sh status.sh
chmod 600 .env
```

Edita `/opt/smtools/.env` con tus valores reales (dominio, OAuth, contraseñas de PostgreSQL).

> **IMPORTANTE:** El `docker-compose.yml` de producción expone la app solo en `127.0.0.1:8080`. Necesitarás un **proxy inverso** (nginx, Caddy, Traefik) para servirla en tu dominio con HTTPS. Ver [Proxy inverso](#proxy-inverso) más abajo.

Los ficheros `.tag` y `.tag.previous` los crea `deploy.sh` automáticamente en el primer deploy — **no hace falta crearlos a mano**.

### Configurar secrets en GitHub

El workflow `deploy.yml` necesita credenciales para conectarse al VPS. Ve a `Settings → Secrets and variables → Actions` de tu repositorio en GitHub y crea los siguientes **repository secrets**:

1. **Generar un par de claves SSH** (si no tienes uno dedicado para despliegue):

   ```bash
   ssh-keygen -t ed25519 -C "smtools-deploy" -f ~/.ssh/smtools-deploy -N ""
   ```

   Esto genera dos archivos:
   - `~/.ssh/smtools-deploy` — **clave privada** (nunca compartir)
   - `~/.ssh/smtools-deploy.pub` — **clave pública** (para instalar en el VPS)

2. **Instalar la clave pública en el VPS**:

   ```bash
   ssh-copy-id -i ~/.ssh/smtools-deploy.pub usuario@vps
   ```

   O manualmente:

   ```bash
   ssh usuario@vps
   echo "CONTENIDO_DE_smtools-deploy.pub" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

3. **Añadir los secrets en GitHub**:

   Navega a `https://github.com/<tu-usuario>/<repo>/settings/secrets/actions` y crea:

   | Secret | Valor |
   |--------|-------|
   | `VPS_HOST` | IP o dominio del VPS (ej: `123.456.789.0` o `tudominio.com`) |
   | `VPS_USER` | Usuario SSH (ej: `deploy` o `root`) |
   | `VPS_SSH_KEY` | Contenido completo del archivo **privado** `~/.ssh/smtools-deploy` |

   > **`VPS_SSH_KEY`** debe ser el contenido exacto de la clave privada (incluyendo `-----BEGIN OPENSSH PRIVATE KEY-----` y `-----END OPENSSH PRIVATE KEY-----`). No usar passphrase en esta clave.

4. **`GITHUB_TOKEN` (automático)**: El workflow usa `secrets.GITHUB_TOKEN` para autenticarse contra GHCR. GitHub lo inyecta automáticamente en cada ejecución — **no necesitas crearlo**. El repositorio debe tener `Settings → Actions → General → Workflow permissions` en **"Read and write permissions"**.

5. **Hacer pública la imagen en GHCR** (requerido si el VPS no está autenticado contra GHCR):

   La primera vez que el workflow haga push a GHCR, el paquete se creará como **privado**. Para que el VPS pueda descargarlo sin un token:

   - Ve a `https://github.com/users/<tu-usuario>/packages/container/<repo>/settings`
   - Desplázate a **"Danger Zone"** y haz clic en **"Make public"**

   > Si prefieres mantenerlo privado, añade un paso de `docker login` al script de despliegue y guarda un PAT (Personal Access Token) con scope `read:packages` en otro secret (ej: `GHCR_PAT`).

### Flujo de CI/CD

Cada push a `main` ejecuta el workflow `deploy.yml`:

1. **`build-and-push`** — Construye la imagen Docker con BuildKit y la sube a `ghcr.io/rivet92/smtools:sha-<short>` (inmutable) y `:latest` (solo conveniencia, nunca se despliega por ella). La imagen lleva el label `org.opencontainers.image.revision` con el SHA completo. Escanea vulnerabilidades con Trivy y las reporta a GitHub Security.
2. **`deploy`** — Se conecta por SSH al VPS y ejecuta `./deploy.sh <short-sha>`, que:

   ```bash
   # deploy.sh (copia local: deploy/deploy.sh)
   docker compose pull app
   IMAGE_TAG="sha-<short>" docker compose up -d app
   # espera hasta ~2.5 min a que el contenedor esté "healthy"
   # si falla: rollback automático a .tag.previous y salida con error
   ```

   Tras el deploy, `.tag` guarda el SHA desplegado y `.tag.previous` el anterior.

**Estado desplegado (qué versión corre exactamente):**

```bash
ssh usuario@vps
cd /opt/smtools
./status.sh
# tag file:        sha-abc12345
# previous tag:    sha-abc12344
# container image: ghcr.io/rivet92/smtools:sha-abc12345
# commit revision: <sha completo del commit>
# health:          healthy
# restarts:        0
```

**Rollback manual:**

```bash
ssh usuario@vps
cd /opt/smtools
docker compose logs --tail=50 app   # diagnosticar
./rollback.sh                       # vuelve a .tag.previous
# o a un commit cualquiera:
./deploy.sh <short-sha>
```

También puedes re-desplegar cualquier SHA desde GitHub: `Actions → Deploy to VPS → Run workflow`, rellenando `ref` con el SHA o tag deseado.

### Proxy inverso

El contenedor expone la app en `127.0.0.1:8080`. Necesitas un proxy inverso que termine TLS y sirva en tu dominio.

**Ejemplo con Caddy** (recomendado por su simplicidad y HTTPS automático):

```caddyfile
# /etc/caddy/Caddyfile
tudominio.com {
    reverse_proxy localhost:8080
}
```

**Ejemplo con nginx:**

```nginx
# /etc/nginx/sites-available/tudominio.com
server {
    listen 443 ssl;
    server_name tudominio.com;

    ssl_certificate     /etc/ssl/certs/tudominio.com.pem;
    ssl_certificate_key /etc/ssl/private/tudominio.com.key;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket (SignalR)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Despliegue manual

Si prefieres no usar CI/CD:

### 1. Configurar variables de entorno

Crea un `.env` en el servidor (usa `deploy/.env.example` como plantilla):

```env
POSTGRES_USER=smtools
POSTGRES_PASSWORD=TU_PASSWORD_SEGURO
POSTGRES_DB=smtools
AUTHENTICATION__GOOGLE__CLIENTID=TU_GOOGLE_CLIENT_ID
AUTHENTICATION__GOOGLE__CLIENTSECRET=TU_GOOGLE_CLIENT_SECRET
AUTHENTICATION__GITHUB__CLIENTID=TU_GITHUB_CLIENT_ID
AUTHENTICATION__GITHUB__CLIENTSECRET=TU_GITHUB_CLIENT_SECRET
FRONTEND_ORIGIN=https://tu-dominio.com
```

### 2. Construir la imagen Docker

```bash
pnpm docker:build
```

La imagen incluye el frontend pre-compilado. Los metadatos SEO/Open Graph (`__APP_URL__`) se inyectan en **tiempo de ejecución** dentro del contenedor a partir de `FRONTEND_ORIGIN` (gestionado por `docker-entrypoint.sh`).

Si necesitas desplegar bajo un subpath:

```bash
BASE_URL=/app pnpm docker:build:base
```

> Asegúrate de que `BASE_URL` esté definida en tu `.env` con el mismo valor.

### 3. Transferir la imagen al servidor

```bash
# Exportar
docker save smtools:latest | gzip > smtools.tar.gz

# Transferir
scp smtools.tar.gz deploy/docker-compose.yml .env usuario@servidor:/ruta/destino/

# En el servidor, cargar
ssh usuario@servidor
docker load < smtools.tar.gz
```

### 4. Ejecutar

```bash
docker compose -f deploy/docker-compose.yml up -d
```

La aplicación estará disponible en `http://localhost:8080`. El backend sirve tanto la API como los archivos estáticos del frontend desde `wwwroot`.

## Logs en producción

El backend usa **Serilog** con salida en formato **JSON** a la consola del contenedor. Esto facilita la recolección con herramientas como Grafana Loki, ELK, Datadog o CloudWatch.

```bash
docker compose -f deploy/docker-compose.yml logs -f app     # tiempo real
docker compose -f deploy/docker-compose.yml logs --tail=100 app  # últimas 100 líneas
```

El compose configura rotación de logs (`max-size: 10m`, `max-file: 3`) para evitar que crezcan indefinidamente.

Para cambiar el nivel de log sin recompilar, define `SERILOG__MINIMUMLEVEL__DEFAULT` en tu `.env` (ej. `Warning` para reducir ruido en producción).
