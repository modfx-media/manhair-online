#!/bin/sh
# Apply db/membership/001_init.sql to a verified empty database in one transaction.
# Does not print DATABASE_URL and does not invent a restore time.
set -e
if [ "$MEMBERSHIP_MIGRATE_MODE" != "empty-isolated" ]; then
  echo "Refusing. Set MEMBERSHIP_MIGRATE_MODE=empty-isolated." >&2
  exit 1
fi
case "$MEMBERSHIP_MIGRATE_RESTORE_POINT" in
  [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z) ;;
  *)
    echo "Refusing. Set MEMBERSHIP_MIGRATE_RESTORE_POINT to the UTC time you confirmed. Do not invent one." >&2
    exit 1
    ;;
esac
if [ -z "$MEMBERSHIP_DB_NAME" ]; then
  echo "Refusing. Set MEMBERSHIP_DB_NAME to the database name you verified." >&2
  exit 1
fi
if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is not set." >&2
  exit 1
fi
sql_file="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)/db/membership/001_init.sql"
if [ ! -f "$sql_file" ]; then
  echo "Refusing. db/membership/001_init.sql was not found." >&2
  exit 1
fi
if grep -Eiq '^[[:space:]]*drop[[:space:]]+' "$sql_file"; then
  echo "Refusing. The schema file contains a DROP." >&2
  exit 1
fi
actual_name="$(psql "$DATABASE_URL" -tAc "SELECT current_database()")"
actual_name="$(printf '%s' "$actual_name" | tr -d '[:space:]')"
if [ "$actual_name" != "$MEMBERSHIP_DB_NAME" ]; then
  echo "Refusing. MEMBERSHIP_DB_NAME does not match current_database()." >&2
  exit 1
fi
foreign="$(psql "$DATABASE_URL" -tAc "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname NOT LIKE 'membership\\_%'")"
foreign="$(printf '%s' "$foreign" | tr -d '[:space:]')"
if [ "$foreign" != "0" ]; then
  echo "Refusing. The public schema has tables that are not membership tables." >&2
  exit 1
fi
echo "Restore point acknowledged: $MEMBERSHIP_MIGRATE_RESTORE_POINT"
echo "Database name matched."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f "$sql_file"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -tAc "SELECT 'membership_members=' || count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'membership_members'"
