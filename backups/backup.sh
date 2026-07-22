#!/bin/bash
set -euo pipefail

CONFIG="/etc/smtools/backup.env"

if [ ! -f "$CONFIG" ]; then
  echo "[$(date)] ERROR: $CONFIG not found" >&2
  exit 1
fi
set -a; source "$CONFIG"; set +a

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/smtools/daily"
DB_FILE="smtools_db_${DATE}.sql.gz.gpg"
AVATARS_FILE="smtools_avatars_${DATE}.tar.gz.gpg"
LOG="/var/log/smtools-backup.log"
RC=0

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup…" >> "$LOG"

# ---- Database ----
docker exec \
  -e PGPASSWORD="$POSTGRES_PASSWORD" \
  smtools_postgres pg_dump \
  -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  --no-owner --no-acl --clean --if-exists 2>>"$LOG" |
  gzip |
  gpg --batch --trust-model always \
    --encrypt --recipient "$GPG_RECIPIENT" \
    -o "${BACKUP_DIR}/${DB_FILE}" 2>>"$LOG"

if [ $? -ne 0 ]; then
    echo "[ERROR] pg_dump failed. Aborting." | tee -a "$LOG"
    exit 1
fi

DB_SIZE=$(stat -c%s "${BACKUP_DIR}/${DB_FILE}" 2>/dev/null || echo 0)
echo "[$(date)] pg_dump done: ${DB_SIZE} bytes" >> "$LOG"

DB_RC=0
for attempt in 1 2 3; do
    if aws s3 cp "${BACKUP_DIR}/${DB_FILE}" "s3://${SCW_BUCKET}/db/" \
        --endpoint-url "$AWS_ENDPOINT_URL" >> "$LOG" 2>&1; then
        DB_RC=0
        break
    fi
    DB_RC=$?
    if [ $attempt -eq 3 ]; then
        echo "S3 upload failed after 3 attempts" >> "$LOG"
    fi
    sleep 5
done

# ---- Avatars ----
AVATAR_CONTAINER="${AVATAR_CONTAINER:-smtools-app}"
AVATAR_DIR="${AVATAR_DIR:-/app/wwwroot/avatars}"
AV_RC=0

if docker exec "$AVATAR_CONTAINER" test -d "$AVATAR_DIR" 2>/dev/null; then
  docker exec "$AVATAR_CONTAINER" tar czf - -C "$(dirname "$AVATAR_DIR")" "$(basename "$AVATAR_DIR")" 2>>"$LOG" |
    gpg --batch --trust-model always \
      --encrypt --recipient "$GPG_RECIPIENT" \
      -o "${BACKUP_DIR}/${AVATARS_FILE}" 2>>"$LOG"

  AV_SIZE=$(stat -c%s "${BACKUP_DIR}/${AVATARS_FILE}" 2>/dev/null || echo 0)
  echo "[$(date)] avatars done: ${AV_SIZE} bytes" >> "$LOG"

  aws s3 cp "${BACKUP_DIR}/${AVATARS_FILE}" "s3://${SCW_BUCKET}/avatars/" \
    --endpoint-url "$AWS_ENDPOINT_URL" >> "$LOG" 2>&1 || AV_RC=$?
else
  echo "[$(date)] avatars dir not found, skipping" >> "$LOG"
fi

RC=$(( DB_RC | AV_RC ))

# ---- Cleanup remote >30 days ----
echo "[$(date)] Cleaning remote backups older than 30 days..." >> "$LOG"
aws s3 rm "s3://${SCW_BUCKET}/db/" --recursive \
  --endpoint-url "$AWS_ENDPOINT_URL" \
  --older-than 30 >> "$LOG" 2>&1 || echo "[WARN] Remote db cleanup failed" >> "$LOG"
aws s3 rm "s3://${SCW_BUCKET}/avatars/" --recursive \
  --endpoint-url "$AWS_ENDPOINT_URL" \
  --older-than 30 >> "$LOG" 2>&1 || echo "[WARN] Remote avatars cleanup failed" >> "$LOG"

# ---- Cleanup local >30 days ----
DELETED=$(find "$BACKUP_DIR" -name "smtools_*.gpg" -mtime +30 -print -delete | wc -l)
echo "[$(date)] Backup complete (exit=${RC}). Deleted=${DELETED}" >> "$LOG"

# Notify on failure (example: log aggregation)
if [ "$RC" -ne 0 ]; then
    echo "[ERROR] Backup failed with code $RC at $(date)" | tee -a "$LOG"
    # TODO: Integrate with alerting (Slack webhook, Healthchecks.io, etc.)
    exit "$RC"
fi

exit $RC
