import { handleAccountGet, handleAccountPost } from "@/lib/membership/handlers";
import { runtimeDeps } from "@/lib/membership/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleAccountGet(request, runtimeDeps());
}

export async function POST(request: Request) {
  return handleAccountPost(request, runtimeDeps());
}
