import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { startBillingPortal } from "@/lib/membership/handlers";
import { runtimeDeps } from "@/lib/membership/runtime";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Billing",
  robots: { index: false, follow: false },
};

/** Stable link used in member email. It never embeds a Stripe portal session URL. */
export default async function BillingPortalPage() {
  const jar = await cookies();
  const headerList = await headers();
  const session = jar.get("mh_member_session")?.value;
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "www.manhaironline.com";
  const request = new Request(`https://${host}/account/billing/`, {
    headers: { cookie: session ? `mh_member_session=${session}` : "", host },
  });
  const result = await startBillingPortal(request, runtimeDeps());
  if (result.signedOut) redirect("/account/?next=billing");
  if (result.url) redirect(result.url);
  return (
    <main className="mx-auto grid max-w-xl gap-4 px-5 py-16">
      <h1 className="mh-display text-4xl">Billing</h1>
      <p>{result.message}</p>
    </main>
  );
}
