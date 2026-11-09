import { Pool } from "@neondatabase/serverless";
import { loadMembershipSchema } from "../lib/membership/sql-store";

/**
 * Applies db/membership/001_init.sql.
 * Refuses to run unless MEMBERSHIP_MIGRATE_CONFIRM=apply.
 * Never prints the connection string.
 */
async function main() {
  if (process.env.MEMBERSHIP_MIGRATE_CONFIRM !== "apply") {
    console.error("Refusing to migrate. Set MEMBERSHIP_MIGRATE_CONFIRM=apply to create membership tables.");
    process.exit(1);
  }
  const restorePoint = process.env.MEMBERSHIP_MIGRATE_RESTORE_POINT?.trim() ?? "";
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(restorePoint)) {
    console.error(
      "Refusing to migrate. Set MEMBERSHIP_MIGRATE_RESTORE_POINT to the Neon restore-point time in UTC, such as 2026-11-08T16:00:00Z. Do not put a connection string in that variable.",
    );
    process.exit(1);
  }
  const mode = process.env.MEMBERSHIP_MIGRATE_MODE?.trim();
  if (mode !== "empty-isolated" && mode !== "production-recovery") {
    console.error("Refusing to migrate. Set MEMBERSHIP_MIGRATE_MODE to empty-isolated or production-recovery.");
    process.exit(1);
  }
  const databaseName = process.env.MEMBERSHIP_DB_NAME?.trim() ?? "";
  if (!databaseName) {
    console.error("Refusing to migrate. Set MEMBERSHIP_DB_NAME to the database name you verified. Do not invent it.");
    process.exit(1);
  }
  if (mode === "production-recovery") {
    const evidence = process.env.MEMBERSHIP_DB_RECOVERY_EVIDENCE?.trim() ?? "";
    if (evidence.length < 12 || evidence === restorePoint) {
      console.error("Refusing production recovery. Set MEMBERSHIP_DB_RECOVERY_EVIDENCE to the recovery record you confirmed. The script will not invent one.");
      process.exit(1);
    }
  }
  console.log(`Restore point acknowledged: ${restorePoint}`);
  console.log(`Mode: ${mode}`);
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const schema = loadMembershipSchema();
  if (/\bdrop\s+/i.test(schema)) {
    console.error("Refusing to migrate. The membership schema contains a DROP.");
    process.exit(1);
  }
  const statements = schema
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();
  try {
    const identity = await client.query("SELECT current_database() AS name");
    const actualName = String(identity.rows[0]?.name ?? "");
    if (actualName !== databaseName) {
      throw new Error("MEMBERSHIP_DB_NAME does not match current_database().");
    }
    if (mode === "empty-isolated") {
      const tables = await client.query(
        "SELECT c.relname AS name FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'r'",
      );
      for (const row of tables.rows) {
        const name = String(row.name);
        if (!name.startsWith("membership_")) {
          throw new Error("The public schema is not empty of non-membership tables.");
        }
        const count = await client.query(`SELECT count(*)::int AS n FROM ${quoteIdent(name)}`);
        if (Number(count.rows[0]?.n ?? 0) > 0) {
          throw new Error("A membership table already has rows.");
        }
      }
    }
    await client.query("BEGIN");
    for (const statement of statements) await client.query(statement);
    const required = await client.query(
      "SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'membership_members'",
    );
    if (Number(required.rows[0]?.n ?? 0) !== 1) {
      throw new Error("membership_members was not created");
    }
    await client.query("COMMIT");
    console.log(`Applied ${statements.length} membership statements to ${actualName}.`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

function quoteIdent(name: string): string {
  if (!/^membership_[a-z0-9_]+$/.test(name)) throw new Error("unexpected table");
  return `"${name}"`;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "migration failed";
  console.error(message.replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted]"));
  process.exit(1);
});
