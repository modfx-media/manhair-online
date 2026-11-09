import { handleHubSignIn } from "@/lib/membership/handlers";
import { runtimeDeps } from "@/lib/membership/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleHubSignIn(request, runtimeDeps());
}
