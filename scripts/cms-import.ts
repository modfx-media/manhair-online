import { readFile } from "node:fs/promises";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { getPayload } from "payload";
import config from "../payload.config";
import { normalizeCmsPath } from "../lib/cms/path";

loadEnv({ path: ".env.local" });
loadEnv();

type ExportFile = {
  version: number;
  records: Array<Record<string, unknown>>;
  globals?: Record<string, Record<string, unknown>>;
};

function skipRef(value: unknown): unknown {
  if (value && typeof value === "object") {
    if ("$ref" in (value as Record<string, unknown>)) return null;
    if (Array.isArray(value)) {
      return value.map(skipRef).filter((item) => item !== null);
    }
    const next: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      const resolved = skipRef(nested);
      if (resolved !== null) next[key] = resolved;
    }
    return next;
  }
  return value;
}

if (process.argv.includes("--publish")) {
  console.error("Refusing to bulk-publish. Import is draft-only.");
  process.exit(1);
}

const wantsApply = process.argv.includes("--apply");
const apply = wantsApply && process.env.CMS_IMPORT_APPLY === "1";

if (wantsApply && !apply) {
  console.error("Set CMS_IMPORT_APPLY=1 with --apply to write drafts.");
  process.exit(1);
}

const filePath = path.resolve(
  process.argv.find((arg) => arg.endsWith(".json")) ?? "data/content-export.json",
);

const raw = JSON.parse(await readFile(filePath, "utf8")) as ExportFile;

if (!apply) {
  console.log(
    `Dry run: ${raw.records.length} records in ${filePath}. Pass CMS_IMPORT_APPLY=1 -- --apply to write drafts.`,
  );
  process.exit(0);
}

if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
  console.error("DATABASE_URL and PAYLOAD_SECRET are required for cms:import --apply");
  process.exit(1);
}

const payload = await getPayload({ config });

async function findExisting(
  collection: "pages" | "posts",
  legacyId: string | null,
  sourceUrl: string | null,
) {
  if (legacyId) {
    const byLegacy = await payload.find({
      collection,
      overrideAccess: true,
      draft: true,
      limit: 1,
      pagination: false,
      where: { legacyId: { equals: legacyId } },
    });
    if (byLegacy.docs[0]) return byLegacy.docs[0];
  }
  if (sourceUrl) {
    const bySource = await payload.find({
      collection,
      overrideAccess: true,
      draft: true,
      limit: 1,
      pagination: false,
      where: { sourceUrl: { equals: sourceUrl } },
    });
    if (bySource.docs[0]) return bySource.docs[0];
  }
  return null;
}

let created = 0;
let updated = 0;
let skipped = 0;

for (const record of raw.records) {
  const collection = record.collection === "posts" ? "posts" : "pages";
  const pathValue = normalizeCmsPath(record.path) ?? normalizeCmsPath(record.sourceUrl);
  if (!pathValue) {
    skipped += 1;
    continue;
  }

  const cleaned = skipRef(record) as Record<string, unknown>;
  const data: Record<string, unknown> = {
    title: cleaned.title,
    heading: cleaned.heading ?? undefined,
    slug: cleaned.slug ?? null,
    path: pathValue,
    legacyId: cleaned.legacyId ?? null,
    sourceUrl: cleaned.sourceUrl ?? null,
    sourceUpdatedAt: cleaned.sourceUpdatedAt ?? undefined,
    excerpt: cleaned.excerpt ?? undefined,
    bodyHtml: cleaned.bodyHtml ?? undefined,
    template: cleaned.template ?? undefined,
    category: cleaned.category ?? undefined,
    coverImage: cleaned.coverImage ?? undefined,
    publishedAt: cleaned.publishedAt ?? undefined,
    _status: "draft",
    meta: cleaned.meta ?? {},
  };

  try {
    const existing = await findExisting(
      collection,
      typeof cleaned.legacyId === "string" ? cleaned.legacyId : null,
      typeof cleaned.sourceUrl === "string" ? cleaned.sourceUrl : null,
    );

    if (existing) {
      await payload.update({
        collection,
        id: existing.id,
        data,
        draft: true,
        overrideAccess: true,
      });
      updated += 1;
    } else {
      await payload.create({
        collection,
        data,
        draft: true,
        overrideAccess: true,
      });
      created += 1;
    }
  } catch (error) {
    skipped += 1;
    const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
    console.warn(`[cms:import] skipped ${collection} ${pathValue}: ${message}`);
  }
}

if (raw.globals) {
  for (const [slug, data] of Object.entries(raw.globals)) {
    try {
      await payload.updateGlobal({
        slug: slug as "header" | "footer" | "site-settings",
        data: skipRef(data) as Record<string, unknown>,
        draft: true,
        overrideAccess: true,
      });
    } catch (error) {
      console.warn(`[cms:import] skip global ${slug}`, error);
    }
  }
}

console.log(
  `Applied drafts: ${created} create, ${updated} update, ${skipped} skipped. Public site stays on designed fallback until publish review.`,
);
