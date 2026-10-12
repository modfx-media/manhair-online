import type { CollectionBeforeOperationHook, Config, Field, Plugin, Where } from "payload";

/**
 * Scheduled publishing guard (added 12 Oct 2026).
 * 1. Enables Payload's native schedulePublish on posts and lets the jobs queue
 *    run from the Vercel cron (Authorization: Bearer $CRON_SECRET) or a logged-in user.
 * 2. Hides posts whose publish date is still in the future from every read that is
 *    not made by a logged-in user or as a draft/preview read (REST, GraphQL and the
 *    site's own Local API queries), until that date passes.
 */
const DATE_CANDIDATES = ["publishedAt", "publishDate", "publishedOn", "datePublished", "published", "postDate", "date"];

function findDateField(fields: Field[]): string | null {
  const names = new Set<string>();
  const visit = (list: Field[]) => {
    for (const f of list as any[]) {
      if (!f) continue;
      if (f.type === "date" && f.name) names.add(f.name);
      if ((f.type === "row" || f.type === "collapsible") && Array.isArray(f.fields)) visit(f.fields);
      if (f.type === "tabs" && Array.isArray(f.tabs)) for (const t of f.tabs) if (!t.name && Array.isArray(t.fields)) visit(t.fields);
    }
  };
  visit(fields);
  for (const c of DATE_CANDIDATES) if (names.has(c)) return c;
  return null;
}

function hideFuturePosts(field: string): CollectionBeforeOperationHook {
  return ({ args, operation, req }) => {
    if (operation !== "read" && operation !== "count") return args;
    const a = args as { where?: Where; draft?: boolean; overrideAccess?: boolean };
    if (req?.user || a.draft === true) return args;
    const notFuture: Where = {
      or: [{ [field]: { exists: false } }, { [field]: { less_than_equal: new Date().toISOString() } }],
    };
    a.where = a.where ? { and: [a.where, notFuture] } : notFuture;
    return args;
  };
}

function cronOrUser({ req }: { req: any }): boolean {
  if (req?.user) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req?.headers?.get?.("authorization") === `Bearer ${secret}`;
}

export const scheduledPublishPlugin =
  (slug = "posts"): Plugin =>
  (config: Config): Config => {
    const collections = (config.collections || []).map((c) => {
      if (c.slug !== slug) return c;
      const field = findDateField(c.fields);
      const versions = c.versions && typeof c.versions === "object" ? c.versions : null;
      const drafts = versions?.drafts;
      const nextVersions = drafts
        ? { ...versions, drafts: { ...(typeof drafts === "object" ? drafts : {}), schedulePublish: true } }
        : c.versions;
      return {
        ...c,
        versions: nextVersions,
        hooks: field
          ? { ...c.hooks, beforeOperation: [...(c.hooks?.beforeOperation || []), hideFuturePosts(field)] }
          : c.hooks,
      };
    });
    const existingRun = config.jobs?.access?.run;
    return {
      ...config,
      collections,
      jobs: {
        ...(config.jobs || {}),
        access: {
          ...(config.jobs?.access || {}),
          run: existingRun ? async (args: any) => cronOrUser(args) || (await (existingRun as any)(args)) : cronOrUser,
        },
      },
    };
  };

export default scheduledPublishPlugin;
