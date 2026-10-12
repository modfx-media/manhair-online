import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { normalizeCmsPath, publicPathFromCms } from "@/lib/cms/path";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("previewSecret");
  const pathParam = request.nextUrl.searchParams.get("path");

  if (!process.env.PREVIEW_SECRET || secret !== process.env.PREVIEW_SECRET) {
    return new Response("Invalid preview secret", { status: 401 });
  }

  if (
    !pathParam ||
    pathParam.includes("null") ||
    pathParam.includes("undefined") ||
    !pathParam.startsWith("/")
  ) {
    return new Response("Invalid path", { status: 400 });
  }

  const path = normalizeCmsPath(pathParam);
  if (!path) {
    return new Response("Invalid path", { status: 400 });
  }

  const draft = await draftMode();
  draft.enable();
  redirect(publicPathFromCms(path));
}
