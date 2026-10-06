import path from "node:path";
import { fileURLToPath } from "node:url";
import { vercelPostgresAdapter } from "@payloadcms/db-vercel-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { seoPlugin } from "@payloadcms/plugin-seo";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { buildConfig } from "payload";
import sharp from "sharp";
import { Media, Users } from "./collections/Users";
import { Pages, Posts } from "./collections/Pages";
import { Footer, Header, SiteSettings } from "./globals/Site";
import { normalizeCmsPath, publicPathFromCms } from "./lib/cms/path";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

function publicOrigin(): string {
  const server = process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "");
  if (server && !server.includes("localhost")) return server;
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (site) return site;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function corsOrigins(): string[] {
  const origins = new Set<string>([
    publicOrigin(),
    "https://www.manhaironline.com",
    "https://manhaironline.com",
    "http://localhost:3000",
  ]);
  if (process.env.VERCEL_URL) origins.add(`https://${process.env.VERCEL_URL}`);
  return [...origins];
}

const isVercel = process.env.VERCEL === "1";
const isImport = Boolean(process.env.CMS_IMPORT_APPLY);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    livePreview: {
      breakpoints: [
        { label: "Mobile", name: "mobile", width: 375, height: 667 },
        { label: "Desktop", name: "desktop", width: 1440, height: 900 },
      ],
    },
  },
  collections: [Users, Media, Pages, Posts],
  globals: [Header, Footer, SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "dev-only-set-PAYLOAD_SECRET-32chars",
  serverURL: publicOrigin(),
  csrf: corsOrigins(),
  cors: corsOrigins(),
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: vercelPostgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
    forceUseVercelPostgres: true,
    push: !isVercel && !isImport,
  }),
  sharp,
  plugins: [
    seoPlugin({
      collections: ["pages", "posts"],
      globals: ["site-settings"],
      uploadsCollection: "media",
      tabbedUI: true,
      generateTitle: ({ doc }) =>
        typeof doc?.title === "string" ? doc.title : "",
      generateDescription: ({ doc }) =>
        typeof doc?.excerpt === "string" ? doc.excerpt : "",
      generateURL: ({ doc }) => {
        const pathValue = normalizeCmsPath(doc?.path);
        if (!pathValue) return "";
        return `${publicOrigin()}${publicPathFromCms(pathValue)}`;
      },
      fields: ({ defaultFields }) => [
        ...defaultFields,
        {
          name: "canonicalUrl",
          type: "text",
          admin: { description: "Must match the public path URL." },
        },
        {
          name: "noIndex",
          type: "checkbox",
          defaultValue: false,
        },
        {
          name: "noFollow",
          type: "checkbox",
          defaultValue: false,
        },
        {
          name: "excludeFromSitemap",
          type: "checkbox",
          defaultValue: false,
        },
      ],
    }),
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: {
        media: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
});
