import type { Metadata } from "next";
import { CherryWidget } from "@/components/CherryWidget";
import { JsonLd, buildPageGraph } from "@/components/JsonLd";
import { SITE, SOCIAL } from "@/lib/site";
import { getPageMeta, toMetadata } from "@/lib/pages";
import { cmsGenerateMetadata } from "@/lib/cms/metadata";
import { CMSRoute } from "@/lib/cms/CMSRoute";

const PAGE = getPageMeta("/payment-plans/")!;
export async function generateMetadata(): Promise<Metadata> {
  return cmsGenerateMetadata(PAGE.path, toMetadata(PAGE));
}

export default function Page() {
  const graph = buildPageGraph({
    origin: SITE.origin,
    path: PAGE.path,
    title: PAGE.title,
    description: PAGE.description,
    image: PAGE.og.image,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Cherry Financing" },
    ],
    organization: {
      name: SITE.orgName,
      url: `${SITE.origin}/`,
      logo: {
        url: `${SITE.origin}${SITE.logo.url}`,
        width: SITE.logo.width,
        height: SITE.logo.height,
        caption: SITE.logo.caption,
      },
      sameAs: SOCIAL.map((s) => s.href),
    },
    siteName: SITE.siteName,
    siteDescription: SITE.tagline,
  });

  return (
    <CMSRoute path={"/payment-plans/"}>
    <div className="mh-light">
      <JsonLd data={graph} />
      <h1 className="sr-only">Cherry Financing</h1>
      <section className="bg-white py-8 md:py-12">
        <div className="mh-container">
          <CherryWidget />
        </div>
      </section>
    </div>
  </CMSRoute>
  );
}
