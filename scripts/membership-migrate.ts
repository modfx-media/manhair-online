import { neon } from "@neondatabase/serverless";
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
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const sql = neon(databaseUrl);
  const statements = loadMembershipSchema()
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await sql.query(statement);
  }
  console.log(`Applied ${statements.length} membership statements.`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "migration failed";
  console.error(message.replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted]"));
  process.exit(1);
});
