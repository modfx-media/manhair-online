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

const apply = process.argv.includes("--apply") || process.env.CMS_IMPORT_APPLY === "1";
const filePath = path.resolve(
  process.argv.find((arg) => arg.endsWith(".json")) ?? "data/content-export.json",
);

const raw = JSON.parse(await readFile(filePath, "utf8")) as ExportFile;

if (!apply) {
  console.log(
    `Dry run: ${raw.records.length} records in ${filePath}. Pass --apply with DATABASE_URL to write drafts.`,
  );
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required for cms:import --apply");
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

  const data: Record<string, unknown> = {
    title: record.title,
    heading: record.heading ?? undefined,
    slug: record.slug ?? null,
    path: pathValue,
    legacyId: record.legacyId ?? null,
    sourceUrl: record.sourceUrl ?? null,
    sourceUpdatedAt: record.sourceUpdatedAt ?? undefined,
    excerpt: record.excerpt ?? undefined,
    bodyHtml: record.bodyHtml ?? undefined,
    template: record.template ?? undefined,
    category: record.category ?? undefined,
    coverImage: record.coverImage ?? undefined,
    publishedAt: record.publishedAt ?? undefined,
    _status: "draft",
    meta: record.meta ?? {},
  };

  const existing = await findExisting(
    collection,
    typeof record.legacyId === "string" ? record.legacyId : null,
    typeof record.sourceUrl === "string" ? record.sourceUrl : null,
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
}

if (apply && raw.globals) {
  for (const [slug, data] of Object.entries(raw.globals)) {
    try {
      await payload.updateGlobal({
        slug: slug as "header" | "footer" | "site-settings",
        data,
        draft: true,
        overrideAccess: true,
      });
    } catch (error) {
      console.warn(`[cms:import] skip global ${slug}`, error);
    }
  }
}

console.log(
  `${apply ? "Applied" : "Would apply"} drafts: ${created} create, ${updated} update, ${skipped} skipped`,
);
