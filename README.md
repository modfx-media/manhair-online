# ManHair Online

Next.js App Router marketing site with Payload CMS 3 as the content / SEO / preview data plane. Designed pages stay as the public visual fallback until a document is published **and** has renderable CMS body content.

## Local development

```bash
cp .env.example .env.local
# Fill PAYLOAD_SECRET, PREVIEW_SECRET, DATABASE_URL (Neon pooled *-pooler.*)
npm install
npm run dev
```

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin

## CMS scripts

```bash
npm run cms:export              # rebuild data/content-export.json from inventory
npm run cms:validate-export     # ensure export covers sitemap paths
npm run cms:bootstrap           # ping Neon + ensure Payload can boot
npm run cms:ensure-admin        # create/update local admin user
CMS_IMPORT_APPLY=1 npm run cms:import -- --apply data/content-export.json
```

Import is **draft-only**. There is no `--publish` path. Public URLs keep designed UI until an editor reviews and publishes one URL at a time.

## Architecture (agency contract)

- Dual layouts: `app/(site)` public, `app/(payload)` admin + API
- Overlay: `CMSRoute` — published doc with body/content wins; otherwise designed children
- Failure: `withCMS` so a down database never 500s the marketing site
- Postgres via `@payloadcms/db-vercel-postgres` + `forceUseVercelPostgres`
- Preview requires `PREVIEW_SECRET`; preview URLs never contain `null` segments

See `installation-script.md` for the full install checklist and invariants.
