import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { consultStartPath } from "@/lib/booking/link";
import { cmsGenerateMetadata } from "@/lib/cms/metadata";
import { getPageMeta, toMetadata } from "@/lib/pages";

const PAGE = getPageMeta("/booking/")!;

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return cmsGenerateMetadata(PAGE.path, toMetadata(PAGE));
}

/** Old GHL calendar URL. Capture the lead, then send them to /book/. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirect(consultStartPath(await searchParams));
}
