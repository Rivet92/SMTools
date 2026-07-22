# SMTools — Backup de base de datos

Backups nocturnos de PostgreSQL + avatares con cifrado asimétrico (GPG) y
almacenamiento local + remoto (Scaleway Object Storage).

## Arquitectura

```
Cron (00:00)
  ├── pg_dump ──▶ gzip ──▶ gpg ──▶ /var/backups/smtools/daily/smtools_db_<date>.sql.gz.gpg
  │                                     ├── local (retención 30 días, purge automático)
  │                                     ├── aws s3 cp ──▶ s3://bucket/db/
  │                                     └── aws s3 rm (objetos >30 días)
  │
  └── docker exec smtools_app tar ──▶ gzip ──▶ gpg ──▶ /var/backups/smtools/daily/smtools_avatars_<date>.tar.gz.gpg
                                                ├── local (retención 30 días, purge automático)
                                                ├── aws s3 cp ──▶ s3://bucket/avatars/
                                                └── aws s3 rm (objetos >30 días)
```

El servidor solo tiene la **clave pública** GPG. La clave privada con su passphrase
está en tu máquina local. Si alguien vulnera el servidor, los backups ya subidos
no se pueden descifrar.

**Retención automática**: tanto los archivos locales como los objetos remotos en S3
se eliminan automáticamente cuando superan los 30 días. No es necesario configurar
lifecycle rules manualmente, aunque se recomienda como redundancia.

Los avatares se almacenan en un volumen Docker (`smtools-avatars`) montado en
`/app/wwwroot/avatars` para que persistan entre reinicios del contenedor.

## Setup en el servidor

### 1. Generar par de claves GPG (en tu máquina local)

```bash
gpg --batch --gen-key <<EOF
Key-Type: RSA
Key-Length: 4096
Name-Real: SMTools Backup
Name-Email: backup@smtools.test
Expire-Date: 0
Passphrase: <pon-una-passphrase-segura>
EOF

# Exportar clave pública (esta es la que subes al servidor)
gpg --export --armor backup@smtools.test > backup-public.key
```

Guarda la clave privada y la passphrase en un gestor de contraseñas.

### 2. Copiar la clave pública al servidor

```bash
scp backup-public.key usuario@servidor:/etc/smtools/
```

### 3. Copiar los scripts al servidor

```bash
scp backups/{backup.sh,restore.sh,.env.example} usuario@servidor:/opt/smtools/scripts/
```

### 4. Preparar el servidor

```bash
# Instalar dependencias
sudo apt update && sudo apt install -y gpg awscli

# Importar clave pública
sudo gpg --import /etc/smtools/backup-public.key

# Configurar credenciales
sudo cp /opt/smtools/scripts/.env.example /etc/smtools/backup.env
sudo nano /etc/smtools/backup.env
```

Ajusta al menos:

| Variable | Valor |
|----------|-------|
| `POSTGRES_PASSWORD` | La password de tu base de datos |
| `GPG_RECIPIENT` | `backup@smtools.test` (o el email/key ID que usaste) |
| `SCW_ACCESS_KEY` | Access key de Scaleway IAM |
| `SCW_SECRET_KEY` | Secret key de Scaleway IAM |
| `SCW_BUCKET` | `smtools-backups` (o el nombre que hayas creado) |
| `AWS_ENDPOINT_URL` | `https://s3.<region>.scw.cloud` |

### 5. Instalar el cron

```bash
echo '0 0 * * * root /opt/smtools/scripts/backup.sh' | sudo tee /etc/cron.d/smtools-backup
```

### 6. Probar el backup

```bash
sudo /opt/smtools/scripts/backup.sh
sudo tail /var/log/smtools-backup.log
```

Verifica que:

- El log muestra `Backup complete.`
- Existen archivos en `/var/backups/smtools/daily/`: `smtools_db_*.sql.gz.gpg` y `smtools_avatars_*.tar.gz.gpg`
- Están cifrados: `file /var/backups/smtools/daily/*.gpg` (debe decir "data" o "GPG", no "ASCII text")
- Aparecen en tu bucket de Scaleway bajo `db/` y `avatars/`

## Restauración

El script `restore.sh` acepta tres modos:

```bash
./backups/restore.sh db       <archivo.sql.gz.gpg>  [db-host] [db-name] [db-user]
./backups/restore.sh avatars  <archivo.tar.gz.gpg>  [container]
./backups/restore.sh all      <prefix>              [db-host] [db-name] [db-user] [container]
```

### Restaurar solo la base de datos

```bash
PGPASSWORD=<db-password> ./backups/restore.sh db \
  smtools_db_20260720_030000.sql.gz.gpg \
  db-host smtools smtools
```

GPG te pedirá la passphrase de la clave privada.

### Restaurar solo los avatares

```bash
./backups/restore.sh avatars \
  smtools_avatars_20260720_030000.tar.gz.gpg \
  smtools_app
```

### Restaurar todo (mismo snapshot)

```bash
PGPASSWORD=<db-password> ./backups/restore.sh all \
  smtools_20260720_030000 \
  db-host smtools smtools smtools_app
```

### Desde el servidor (solo si llevas la clave privada)

```bash
# Copiar la clave privada al servidor (temporalmente)
gpg --import backup-private.key

# Restaurar
PGPASSWORD=<db-password> /opt/smtools/scripts/restore.sh all \
  /var/backups/smtools/daily/smtools_20260720_030000 \
  localhost smtools smtools smtools_app

# Eliminar la clave privada del servidor
gpg --delete-secret-keys backup@smtools.test
```

## Preparación en Scaleway

1. Ve a **IAM** → **Credentials** → crear unas credenciales con política de solo
   lectura/escritura en Object Storage (nunca uses la clave maestra del proyecto).
2. Ve a **Object Storage** → crear un bucket (ej. `smtools-backups`).
3. (Opcional, redundancia recomendada) En la pestaña **Lifecycle Rules** del bucket, añade una regla:
   - **Name**: `expire-old-backups`
   - **Days**: `30`
   - **Action**: `Delete`
   
   El script de backup ya limpia los objetos >30 días con `aws s3 rm --older-than 30`,
   pero la lifecycle rule actúa como salvaguarda si el script falla durante varios días.

## Ficheros del proyecto

| Ruta | Propósito |
|------|-----------|
| `backups/backup.sh` | Script de backup: db + avatares |
| `backups/restore.sh` | Script de restauración con 3 modos |
| `backups/.env.example` | Plantilla de configuración |
| `deploy/docker-compose.yml` | Volumen `smtools-avatars` para persistencia |
