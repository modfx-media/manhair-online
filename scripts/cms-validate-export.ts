import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildContentExport, sitemapPublicPaths } from "../lib/cms/inventory";
import { normalizeCmsPath } from "../lib/cms/path";

const filePath = path.resolve("data/content-export.json");
let records: Array<{ path?: string; sourceUrl?: string }> = [];
try {
  const parsed = JSON.parse(await readFile(filePath, "utf8")) as {
    records: Array<{ path?: string; sourceUrl?: string }>;
  };
  records = parsed.records;
} catch {
  records = buildContentExport().records;
}

const exported = new Set(
  records
    .map((r) => normalizeCmsPath(r.path) ?? normalizeCmsPath(r.sourceUrl))
    .filter((p): p is string => Boolean(p)),
);

const missing = sitemapPublicPaths().filter((p) => !exported.has(p));
if (missing.length) {
  console.error(`Export missing ${missing.length} sitemap paths:`);
  for (const item of missing.slice(0, 50)) console.error(`  ${item}`);
  process.exit(1);
}

console.log(`Export covers all ${exported.size} inventory paths (${records.length} records).`);
