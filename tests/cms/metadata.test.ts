import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import type { Metadata } from "next";
import { cmsGenerateMetadata, metadataFromCmsDoc } from "../../lib/cms/metadata";
import { getPageMeta, toMetadata } from "../../lib/pages";
import { getPostBySlug } from "../../lib/posts";
import { getCity } from "../../lib/seo/cities";
import { pageTitle, socialMetadata } from "../../lib/seo/meta";
import { getService } from "../../lib/seo/services";
import { SITE } from "../../lib/site";

const require = createRequire(import.meta.url);
const { resolveTitle } = require("next/dist/lib/metadata/resolvers/resolve-title.js") as {
  resolveTitle: (title: unknown, template: string | null) => { absolute: string };
};

/** Document title template from `app/(site)/layout.tsx`. */
const BRAND_TEMPLATE = "%s | ManHair";

/**
 * Open Graph / Twitter titles inherit a template only when a parent sets
 * `openGraph.title.template`. This layout sets a string `openGraph.title`,
 * so the stashed OG template is null. Assertions use both: null for
 * byte-identical head tags, and the brand template to prove a CMS title
 * stays verbatim even if that template is applied.
 */
const OG_TEMPLATE: string | null = null;

const CMS_TITLE = "Our Story | Drug-Free Pain Relief in Saint Louis Park";
const CMS_DESCRIPTION =
  "Published Payload description that must be rendered verbatim, including this extra sentence so a length clamp would be visible if one were applied to the meta description, the Open Graph description, or the Twitter description.";

function rendered(title: unknown, template: string | null): string {
  return resolveTitle(title, template).absolute;
}

function socialField(
  social: Metadata["openGraph"] | Metadata["twitter"],
  key: "title" | "description",
): unknown {
  if (!social || !(key in social)) return undefined;
  return social[key];
}

function absoluteText(title: Metadata["title"]): string {
  assert.ok(title && typeof title === "object" && "absolute" in title && title.absolute);
  return title.absolute;
}

function publishedDoc(meta: Record<string, unknown>, path = "/about"): Record<string, unknown> {
  return {
    title: "Document heading that must not replace an empty SEO title",
    excerpt: "Document excerpt that must not replace an empty SEO description.",
    path,
    meta,
  };
}

function assertEmptySeoLeavesFallback(fallback: Metadata) {
  const result = metadataFromCmsDoc(
    publishedDoc({ title: "", description: "", canonicalUrl: "" }),
    fallback,
  );
  assert.deepEqual(result.title, fallback.title);
  assert.equal(result.description, fallback.description);
  assert.equal(socialField(result.openGraph, "title"), socialField(fallback.openGraph, "title"));
  assert.equal(
    socialField(result.openGraph, "description"),
    socialField(fallback.openGraph, "description"),
  );
  assert.equal(socialField(result.twitter, "title"), socialField(fallback.twitter, "title"));
  assert.equal(
    socialField(result.twitter, "description"),
    socialField(fallback.twitter, "description"),
  );
  assert.equal(rendered(result.title, BRAND_TEMPLATE), rendered(fallback.title, BRAND_TEMPLATE));
  assert.equal(rendered(result.openGraph?.title, OG_TEMPLATE), rendered(fallback.openGraph?.title, OG_TEMPLATE));
  assert.equal(rendered(result.twitter?.title, OG_TEMPLATE), rendered(fallback.twitter?.title, OG_TEMPLATE));
}

function assertVerbatimTitle(fallback: Metadata) {
  const result = metadataFromCmsDoc(publishedDoc({ title: CMS_TITLE }), fallback);
  assert.equal(rendered(result.title, BRAND_TEMPLATE), CMS_TITLE);
  assert.equal(rendered(result.openGraph?.title, BRAND_TEMPLATE), CMS_TITLE);
  assert.equal(rendered(result.twitter?.title, BRAND_TEMPLATE), CMS_TITLE);
  assert.equal(rendered(result.openGraph?.title, OG_TEMPLATE), CMS_TITLE);
  assert.equal(rendered(result.twitter?.title, OG_TEMPLATE), CMS_TITLE);
  assert.equal(rendered(CMS_TITLE, BRAND_TEMPLATE), `${CMS_TITLE} | ManHair`);
  assert.equal(result.description, fallback.description);
  assert.equal(socialField(result.openGraph, "description"), socialField(fallback.openGraph, "description"));
  assert.equal(result.openGraph?.url, fallback.openGraph?.url);
  assert.deepEqual(result.openGraph?.images, fallback.openGraph?.images);
}

function assertVerbatimDescription(fallback: Metadata) {
  const result = metadataFromCmsDoc(publishedDoc({ description: CMS_DESCRIPTION }), fallback);
  assert.equal(result.description, CMS_DESCRIPTION);
  assert.equal(socialField(result.openGraph, "description"), CMS_DESCRIPTION);
  assert.equal(socialField(result.twitter, "description"), CMS_DESCRIPTION);
  assert.deepEqual(result.title, fallback.title);
  assert.equal(socialField(result.openGraph, "title"), socialField(fallback.openGraph, "title"));
  assert.equal(socialField(result.twitter, "title"), socialField(fallback.twitter, "title"));
}

function locationFallback(): Metadata {
  const city = getCity("irvine");
  assert.ok(city);
  const title = `Hair Replacement Systems for Men in ${city.name}, CA | ManHair`;
  const description = `Custom men's hair replacement for ${city.name}, ${city.county}. Fitted at our Orange, CA studio. Start with a free virtual consultation.`;
  const path = `/locations/${city.slug}/`;
  const url = `${SITE.origin}${path}`;
  return {
    metadataBase: new URL(SITE.origin),
    title: pageTitle(title),
    description,
    alternates: { canonical: url },
    ...socialMetadata({ title, description, url }),
  };
}

function cityServiceFallback(): Metadata {
  const city = getCity("irvine");
  const service = getService("mens-hair-systems");
  assert.ok(city && service);
  const title = `${service.name} in ${city.name}, CA | ManHair`;
  const description = `${service.name} in ${city.name}, CA. Fitted at our Orange studio for ${city.county} clients. Book a free virtual consultation.`;
  const path = `/locations/${city.slug}/${service.slug}/`;
  const url = `${SITE.origin}${path}`;
  return {
    metadataBase: new URL(SITE.origin),
    title: pageTitle(title),
    description,
    alternates: { canonical: url },
    ...socialMetadata({ title, description, url, image: service.image }),
  };
}

function blogFallback(): Metadata {
  const post = getPostBySlug("a-guide-to-full-head-hair-replacement-for-men");
  assert.ok(post);
  const preferredTitle =
    post.title && post.title !== "Man Hair - Hair Replacement Solutions"
      ? post.title
      : (post.heading ?? post.title);
  const description = post.description ?? SITE.brandStatement;
  const url = post.canonical ?? `${SITE.origin}${post.path}`;
  const social = socialMetadata({
    title: preferredTitle,
    description,
    url,
    image: post.coverImage,
    imageAlt: preferredTitle,
  });
  return {
    metadataBase: new URL(SITE.origin),
    title: pageTitle(preferredTitle),
    description,
    alternates: { canonical: url },
    robots: post.robots,
    openGraph: {
      ...social.openGraph,
      type: "article",
      publishedTime: post.datePublished ?? undefined,
      modifiedTime: post.dateModified ?? undefined,
    },
    twitter: social.twitter,
  };
}

const pages: Array<[string, Metadata]> = [
  ["home", toMetadata(getPageMeta("/"))],
  ["normal page", toMetadata(getPageMeta("/about/"))],
  ["location page", locationFallback()],
  ["generated city + service page", cityServiceFallback()],
  ["blog post", blogFallback()],
];

test("site layout still suffixes string titles with the brand", () => {
  const layout = readFileSync(new URL("../../app/(site)/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /template:\s*"%s \| ManHair"/);
  assert.equal(rendered("Account", BRAND_TEMPLATE), "Account | ManHair");
  assert.equal(rendered({ absolute: "Account" }, BRAND_TEMPLATE), "Account");
});

for (const [label, fallback] of pages) {
  test(`empty CMS SEO title and description leave the ${label} fallback unchanged`, () => {
    assertEmptySeoLeavesFallback(fallback);
  });

  test(`CMS title is the verbatim document, Open Graph, and Twitter title for ${label}`, () => {
    assertVerbatimTitle(fallback);
  });

  test(`CMS description is verbatim for ${label}`, () => {
    assertVerbatimDescription(fallback);
  });

  test(`a CMS title that matches the ${label} fallback is not given another brand suffix`, () => {
    const current = absoluteText(fallback.title);
    const result = metadataFromCmsDoc(publishedDoc({ title: current, description: fallback.description }), fallback);
    assert.equal(rendered(result.title, BRAND_TEMPLATE), current);
    assert.equal(rendered(result.openGraph?.title, OG_TEMPLATE), rendered(fallback.openGraph?.title, OG_TEMPLATE));
    assert.equal(rendered(result.twitter?.title, OG_TEMPLATE), rendered(fallback.twitter?.title, OG_TEMPLATE));
    assert.equal(result.description, fallback.description);
  });
}

test("CMS title does not change canonical or robots", () => {
  const fallback = toMetadata(getPageMeta("/about/"));
  const empty = metadataFromCmsDoc(publishedDoc({ title: "" }, "/about"), fallback);
  const titled = metadataFromCmsDoc(publishedDoc({ title: CMS_TITLE }, "/about"), fallback);
  assert.deepEqual(titled.alternates, empty.alternates);
  assert.deepEqual(titled.robots, empty.robots);
  assert.equal(titled.robots, fallback.robots);
});

test("noindex and nofollow still come from the CMS document", () => {
  const fallback = toMetadata(getPageMeta("/about/"));
  const hidden = metadataFromCmsDoc(
    publishedDoc({ title: CMS_TITLE, noIndex: true, noFollow: true }),
    fallback,
  );
  assert.deepEqual(hidden.robots, { index: false, follow: false });
  assert.equal(rendered(hidden.title, BRAND_TEMPLATE), CMS_TITLE);
});

test("a string fallback keeps the brand suffix until CMS meta.title is set", () => {
  const fallback: Metadata = {
    title: "Hair Preview Tool",
    robots: "noindex, nofollow",
  };
  const empty = metadataFromCmsDoc(
    publishedDoc({ title: "", description: "" }, "/hair-preview"),
    fallback,
  );
  assert.equal(empty.title, "Hair Preview Tool");
  assert.equal(empty.description, undefined);
  assert.equal(empty.openGraph, undefined);
  assert.equal(empty.twitter, undefined);
  assert.equal(rendered(empty.title, BRAND_TEMPLATE), "Hair Preview Tool | ManHair");

  const titled = metadataFromCmsDoc(
    publishedDoc({ title: "Hair Preview Tool" }, "/hair-preview"),
    fallback,
  );
  assert.equal(rendered(titled.title, BRAND_TEMPLATE), "Hair Preview Tool");
  assert.equal(rendered(titled.openGraph?.title, BRAND_TEMPLATE), "Hair Preview Tool");
  assert.equal(rendered(titled.twitter?.title, BRAND_TEMPLATE), "Hair Preview Tool");
  assert.equal(titled.description, undefined);
  assert.equal(socialField(titled.openGraph, "description"), SITE.brandStatement);
  const images = titled.openGraph?.images;
  const image = Array.isArray(images) ? images[0] : images;
  assert.ok(image && typeof image === "object" && "url" in image);
  assert.equal(String(image.url), "/images/og-default.jpg");
});

test("no published CMS doc returns the fallback metadata object", async () => {
  delete process.env.DATABASE_URL;
  delete process.env.PAYLOAD_SECRET;
  const fallback = toMetadata(getPageMeta("/"));
  const result = await cmsGenerateMetadata("/", fallback);
  assert.equal(result, fallback);
});
