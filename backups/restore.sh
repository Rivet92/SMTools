#!/bin/bash
set -euo pipefail
# Uso:
#   ./backups/restore.sh db     <backup.sql.gz.gpg>  [db-host] [db-name] [db-user]
#   ./backups/restore.sh avatars <backup.tar.gz.gpg> [container]
#   ./backups/restore.sh all    <prefix>             [db-host] [db-name] [db-user] [container]
#
# Ejemplos:
#   PGPASSWORD=xxx ./backups/restore.sh db smtools_db_20260720_030000.sql.gz.gpg
#   ./backups/restore.sh avatars smtools_avatars_20260720_030000.tar.gz.gpg
#   PGPASSWORD=xxx ./backups/restore.sh all smtools_20260720_030000

MODE="${1:?Usage: $0 <db|avatars|all> <file|prefix> ...}"
shift

case "$MODE" in
  db)
    BACKUP_FILE="${1:?Usage: $0 db <file> [db-host] [db-name] [db-user]}"
    DB_HOST="${2:-localhost}"
    DB_NAME="${3:-smtools}"
    DB_USER="${4:-smtools}"

    gpg --decrypt "$BACKUP_FILE" |
      gunzip -c |
      PGPASSWORD="${PGPASSWORD:?Set PGPASSWORD env var}" \
        psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME"
    ;;

  avatars)
    BACKUP_FILE="${1:?Usage: $0 avatars <file> [container]}"
    CONTAINER="${2:-smtools_app}"

    gpg --decrypt "$BACKUP_FILE" |
      docker exec -i "$CONTAINER" tar xzf - -C /app/wwwroot
    ;;

  all)
    PREFIX="${1:?Usage: $0 all <prefix> [db-host] [db-name] [db-user] [container]}"
    shift

    # Reusa el resto de args: db-host db-name db-user container
    "$0" db "${PREFIX}_db_*.sql.gz.gpg" "$@"
    "$0" avatars "${PREFIX}_avatars_*.tar.gz.gpg" "${@:4}"
    ;;

  *)
    echo "Unknown mode: $MODE. Use db, avatars, or all." >&2
    exit 1
    ;;
esac
