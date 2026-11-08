import { loadMembershipSchema } from "../lib/membership/sql-store";

/**
 * Static check only. Does not connect to a database and does not apply SQL.
 * Fails if the membership migration deletes rows or drops tables.
 */
const sql = loadMembershipSchema();
const forbidden = [/drop\s+table/i, /\bdelete\s+from\b/i, /\btruncate\b/i, /drop\s+column/i];
const hits = forbidden.filter((pattern) => pattern.test(sql));
if (hits.length) {
  console.error("Migration check failed: destructive statement found.");
  process.exit(1);
}
const drops = sql.split("\n").filter((line) => /^\s*drop\s+/i.test(line));
if (drops.length) {
  console.error("Migration check failed: unexpected DROP.");
  process.exit(1);
}
if (!/create\s+table\s+if\s+not\s+exists\s+membership_members/i.test(sql)) {
  console.error("Migration check failed: membership_members table missing.");
  process.exit(1);
}
if (!/create\s+table\s+if\s+not\s+exists\s+membership_suitability_cases/i.test(sql)) {
  console.error("Migration check failed: suitability cases missing.");
  process.exit(1);
}
if (!/create\s+table\s+if\s+not\s+exists\s+membership_appointments/i.test(sql)) {
  console.error("Migration check failed: appointments missing.");
  process.exit(1);
}
if (!/create\s+table\s+if\s+not\s+exists\s+membership_alert_outbox/i.test(sql)) {
  console.error("Migration check failed: alert outbox missing.");
  process.exit(1);
}
console.log("Migration check passed. No table drops, deletes, or truncates.");
console.log("No DROP statements. Data rows are not deleted.");
console.log("This check did not connect to Neon and did not apply the migration.");
