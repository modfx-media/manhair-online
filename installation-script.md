\---  
name: payload-cms-integration  
description: \>-  
  Integrate Payload CMS 3 into a Next.js App Router site as the source of  
  truth for content, nav, media, SEO, preview, search, and publishing, while  
  keeping designed UI as a visual fallback and preserving every public URL.  
  Use when the user mentions Payload, Payload CMS, cms:import, live preview,  
  /admin, Neon Postgres with Payload, migrating hardcoded pages into Payload,  
  or connecting the frontend to Payload.  
\---

\# Payload CMS integration (Next.js App Router)

Agency-wide contract. Same architecture every client. Restyle to the current site. Do not wrap the marketing site in Payload's frontend renderer.

\*\*Do not\*\* copy a client's collections, copy, or branding. Copy the \*\*dual-layout \+ overlay \+ draft-first\*\* rules.

\#\# Contract

| Item | Rule |  
|---|---|  
| CMS | Payload 3.x inside the same Next.js app |  
| Public UI | Existing designed pages stay. Payload does not replace them until a \*\*published\*\* doc exists |  
| Layouts | Dual route groups: \`app/(site)\` public, \`app/(payload)\` admin \+ API |  
| Database | Postgres (Neon). Never SQLite |  
| Adapter | \`@payloadcms/db-vercel-postgres\` with \`forceUseVercelPostgres\` for Neon hosts (5432 is often blocked; WebSockets use 443\) |  
| Publishing | Import and new editorial work default to \*\*draft\*\*. Never \`--publish\` a bulk import over designed pages |  
| Overlay | \`CMSRoute\` / query-first: published CMS doc wins; otherwise render hardcoded children |  
| Failure | \`withCMS(fn, fallback)\` so a down database never 500s the public site |  
| URLs | Keep every production path. \`path\` is unique, starts with \`/\`, no trailing slash, never \`null\`/\`undefined\` segments |  
| Header/Footer | Keep the designed shell. Do not swap in an unstyled CMS header |  
| Preview | \`PREVIEW\_SECRET\` required. Preview URLs must be valid public paths only |  
| Media | Vercel Blob when \`BLOB\_READ\_WRITE\_TOKEN\` is set; otherwise local \`/media\` 404s in production |

For env, Neon, editor bugs, and import scripts, see \[reference.md\](reference.md).

\#\# Install checklist

Copy this and track it:

\`\`\`  
\- \[ \] Dual layouts (site) / (payload) — admin at /admin  
\- \[ \] withPayload(nextConfig) in next.config.ts  
\- \[ \] payload.config.ts \+ PAYLOAD\_SECRET  
\- \[ \] Neon DATABASE\_URL (pooled) \+ vercelPostgresAdapter  
\- \[ \] Users, Media, Pages, Posts (minimum) \+ Header/Footer/Site Settings globals  
\- \[ \] versions.drafts without autosave  
\- \[ \] unique slug/path/legacyId empty → null  
\- \[ \] previewFromPath rejects null segments; PREVIEW\_SECRET set  
\- \[ \] app/(site)/next/preview/route.ts  
\- \[ \] lib/cms/safe.ts withCMS fallback  
\- \[ \] CMSRoute overlay on designed pages  
\- \[ \] generateMetadata from CMS with hardcoded fallback  
\- \[ \] sitemap skips noindex / excludeFromSitemap  
\- \[ \] 404 is noindex, follow  
\- \[ \] BLOB\_READ\_WRITE\_TOKEN on Vercel  
\- \[ \] NEXT\_PUBLIC\_SERVER\_URL is the public https origin on Vercel (never localhost)  
\- \[ \] PAYLOAD\_SECRET, DATABASE\_URL (pooled), PREVIEW\_SECRET on Vercel Production and Preview  
\- \[ \] CORS/CSRF include www and apex of the public site  
\- \[ \] (payload) layout and admin page are \`dynamic \= "force-dynamic"\`  
\- \[ \] After env changes, redeploy, then \`curl \-I /admin\` is not 500  
\- \[ \] Import as drafts; public site unchanged until publish review  
\`\`\`

\#\# Invariants (non-negotiable)

1\. \*\*Do not wrap the site in Payload.\*\* Public pages keep their designed components. Payload is the data plane.  
2\. \*\*Do not publish generic blocks over designed pages\*\* until a human reviews them in \`/admin\`.  
3\. \*\*Do not replace ConditionalShell / designed nav\*\* with a generic \`CMSHeader\`.  
4\. \*\*Do not require unique empty strings.\*\* \`''\` on unique \`slug\` / \`path\` / \`legacyId\` must become \`null\` or create forms blank out.  
5\. \*\*Do not enable \`versions.drafts.autosave\`.\*\* It breaks Payload create forms with live preview.  
6\. \*\*Do not generate preview URLs\*\* like \`/blog/null\`. If path/slug is missing, return \`null\`.  
7\. \*\*Do not import with \`--publish\`\*\* unless the user explicitly asks after reviewing drafts.  
8\. \*\*Do not call the install done because the homepage returns 200.\*\* Public pages use \`withCMS\` and keep rendering when Payload cannot boot. \`/admin\` and \`/api/\*\` throw. A production 500 on \`/admin\` with a healthy homepage means \`PAYLOAD\_SECRET\` or pooled \`DATABASE\_URL\` is missing on that Vercel environment.  
9\. \*\*Do not copy local \`NEXT\_PUBLIC\_SERVER\_URL=http://localhost:3000\` to Vercel.\*\* On Vercel it must be the public origin (\`https://www.example.com\`). If it is missing or localhost, \`serverURL\` must fall back to \`NEXT\_PUBLIC\_SITE\_URL\`. CSRF/CORS must include both \`www\` and apex, plus \`VERCEL\_URL\`.

\#\# Step 1 — Dual App Router layouts

\`\`\`  
app/  
  (site)/          \# public marketing site \+ /next/preview  
    layout.tsx  
    page.tsx  
    next/preview/route.ts  
  (payload)/       \# generated Payload admin  
    layout.tsx  
    admin/\[\[...segments\]\]/page.tsx  
    api/\[...slug\]/route.ts  
\`\`\`

\- \`(payload)\` layout stays the Payload \`RootLayout\`.  
\- \`(site)\` layout keeps fonts, analytics, and the designed chrome.  
\- \`next.config.ts\` must export \`withPayload(nextConfig, { devBundleServerPackages: false })\`.

\#\# Step 2 — Config \+ database

\- \`payload.config.ts\` at repo root. \`secret: process.env.PAYLOAD\_SECRET\`.  
\- Prefer pooled \`DATABASE\_URL\` (\`\*-pooler.\*\`). Direct \`DATABASE\_URL\_UNPOOLED\` (port 5432\) times out on many networks.  
\- Local \+ Vercel: \`vercelPostgresAdapter({ forceUseVercelPostgres: true, push: false on Vercel/import })\`.  
\- \`serverExternalPackages\`: \`pg\`, \`@payloadcms/db-vercel-postgres\`, \`@neondatabase/serverless\`, \`@vercel/postgres\`.

\#\# Step 3 — Collections that actually save

Every public collection:

\- \`slug\` / \`path\` unique with \`beforeValidate\` empty → \`null\`  
\- \`path\` not required at create time (generate on publish or from slug)  
\- \`admin.preview\` \+ \`livePreview.url\` via \`previewFromPath\` (see \[reference.md\](reference.md))  
\- \`versions: { drafts: { schedulePublish: true }, maxPerDoc: 50 }\` — \*\*no autosave\*\*  
\- Globals (Header/Footer/Site Settings): do not mark logo/nav required or editors cannot save an empty first draft

\#\# Step 4 — Connect the frontend without visual regression

\`\`\`ts  
export async function withCMS\<T\>(fn: () \=\> Promise\<T\>, *fallback*: T): Promise\<T\> {  
  try {  
    return await fn()  
  } catch (error) {  
    console.error('\[cms\]', error)  
    return fallback  
  }  
}  
\`\`\`

Overlay pattern (designed UI is \`children\`):

\`\`\`tsx  
export async function CMSRoute({ *path*, *children* }) {  
  const \[routed, draft\] \= await Promise.all(\[  
    queryRoutedContentByPath(path),  
    draftMode(),  
  \])  
  if (\!routed) return children  
  return (  
    \<\>  
      {draft.isEnabled && \<LivePreviewListener /\>}  
      \<RenderRoutedContent *doc*\={routed.doc} /\>  
    \</\>  
  )  
}  
\`\`\`

Queries: \`draft\` \+ \`overrideAccess\` only when \`draftMode().isEnabled\`. Public visitors see published docs only.

\`generateMetadata\` uses CMS meta when a published doc exists, otherwise the existing hardcoded \`Metadata\`.

\#\# Step 5 — Migrate existing URLs as drafts

1\. Inventory every sitemap / public URL.  
2\. Export into \`{ version: 1, records, globals }\`. Public records need \`sourceUrl\` or \`path\`.  
3\. Import \*\*idempotent\*\* by \`legacyId\` then \`sourceUrl\`. Default \`\_status: draft\`.  
4\. Skip missing \`$ref\`s (do not throw). Import FAQs/related targets \*\*before\*\* documents that point at them.  
5\. After import: \`/admin\` shows drafts; public site still uses designed fallback.  
6\. Publish one URL at a time after visual review. Then search reindex.

Run import with \`tsx\` \+ \`dotenv\`, not \`payload run\` — \`payload run\` swallows \`--apply\`.

\`\`\`  
CMS\_IMPORT\_APPLY=1 pnpm cms:import \-- \--apply data/content-export.json  
\`\`\`

\#\# Step 6 — SEO \+ sitemap

\- Plugin SEO fields: \`canonicalUrl\`, \`noIndex\`, \`noFollow\`, \`excludeFromSitemap\`.  
\- Canonical must match the public path.  
\- Sitemap: skip \`noIndex\` / \`excludeFromSitemap\`. Use CMS \`updatedAt\` / \`sourceUpdatedAt\` when present.  
\- \`not-found\`: \`robots: { index: false, follow: true }\`.  
\- Validate export coverage against the URL manifest before calling migration done.

\#\# Production switch

Payload is live as the \*\*admin \+ query source\*\* as soon as \`/admin\` works.

The \*\*public renderer\*\* switches per URL when that document is published. Until then, hardcoded pages stay. That is the intended production cutover, not a bulk publish of 500 generic block documents.

\#\# Verify

\- \`/admin\` create form for each collection saves without a blank crash  
\- Live preview opens a real path, never \`/null\`  
\- Designed homepage still renders when CMS home is draft  
\- One published test page overlays CMS content on that URL only  
\- \`pnpm cms:validate-export\` (or equivalent) covers every sitemap path  
