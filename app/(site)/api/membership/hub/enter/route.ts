import { handleHubEnter } from "@/lib/membership/handlers";
import { runtimeDeps } from "@/lib/membership/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleHubEnter(request, runtimeDeps());
}
