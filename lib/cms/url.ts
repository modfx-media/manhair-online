const LOCALHOST = /localhost|127\.0\.0\.1/i;

function stripSlash(value: string): string {
  return value.replace(/\/$/, "");
}

/** Apex hostname of the public site, without `www`. */
export function siteApex(): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.manhaironline.com";
  try {
    return new URL(site).hostname.replace(/^www\./, "");
  } catch {
    return "manhaironline.com";
  }
}

/**
 * Public https origin on Vercel. Never copies localhost into production:
 * falls back to NEXT_PUBLIC_SITE_URL, then VERCEL_URL.
 */
export function getServerURL(): string {
  const explicit = process.env.NEXT_PUBLIC_SERVER_URL;
  if (explicit && !LOCALHOST.test(explicit)) return stripSlash(explicit);

  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site && !LOCALHOST.test(site)) return stripSlash(site);

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return stripSlash(explicit || site || "http://localhost:3000");
}

export function getCorsOrigins(): string[] {
  const origins = new Set<string>();
  const add = (value?: string | null) => {
    if (!value) return;
    origins.add(stripSlash(value.startsWith("http") ? value : `https://${value}`));
  };

  const apex = siteApex();
  add(`https://${apex}`);
  add(`https://www.${apex}`);
  add(process.env.NEXT_PUBLIC_SITE_URL);
  add(process.env.NEXT_PUBLIC_SERVER_URL);
  if (process.env.VERCEL_URL) add(`https://${process.env.VERCEL_URL}`);
  add("http://localhost:3000");

  return [...origins];
}

export function requirePayloadSecret(): string {
  const secret = process.env.PAYLOAD_SECRET?.trim();
  if (secret) return secret;
  // Fail the Vercel boot/build when secret is missing (Invariant 8).
  // Local `next build` may set NODE_ENV=production without Vercel envs.
  if (process.env.VERCEL === "1") {
    throw new Error(
      "PAYLOAD_SECRET is required on Vercel. Set it for Production and Preview, then redeploy.",
    );
  }
  return "dev-only-set-PAYLOAD_SECRET-32chars";
}
