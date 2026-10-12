import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { buildContentExport } from "../lib/cms/inventory";

loadEnv({ path: ".env.local" });
loadEnv();

const outFile = path.resolve("data/content-export.json");
await mkdir(path.dirname(outFile), { recursive: true });
const payload = buildContentExport();
await writeFile(outFile, JSON.stringify(payload, null, 2));
console.log(`Wrote ${payload.records.length} records to ${outFile}`);
