import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { AccountPanel } from "@/components/membership/AccountPanel";
import { PreviewNotice } from "@/components/membership/PreviewNotice";
import { loadAccountPage } from "@/lib/membership/handlers";
import { runtimeDeps } from "@/lib/membership/runtime";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const query = await searchParams;
  const jar = await cookies();
  const headerList = await headers();
  const session = jar.get("mh_member_session")?.value;
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "www.manhaironline.com";
  const request = new Request(`https://${host}/account/`, {
    headers: { cookie: session ? `mh_member_session=${session}` : "", host },
  });
  const data = await loadAccountPage(request, runtimeDeps());
  return (
    <main className="mx-auto grid max-w-3xl gap-6 px-5 py-12 md:py-16">
      <PreviewNotice />
      <AccountPanel member={data.member} invoices={data.invoices} pauses={data.pauses} cancellationRequests={data.cancellationRequests} afterCheckout={query.next === "checkout"} />
    </main>
  );
}
