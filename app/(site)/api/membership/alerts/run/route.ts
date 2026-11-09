import { drainAlerts } from "@/lib/membership/handlers";
import { runDueLifecycle } from "@/lib/membership/lifecycle-send";
import { runtimeDeps } from "@/lib/membership/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function run(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const header = request.headers.get("authorization") ?? "";
  if (!secret || header !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "cron_unauthorized" }, { status: 401 });
  }
  const deps = runtimeDeps();
  const result = await drainAlerts(deps);
  if (result.unavailable) {
    return Response.json({ ok: false, error: "database_not_configured" }, { status: 503 });
  }
  const lifecycle = await runDueLifecycle(deps);
  return Response.json({ ok: true, ...result, lifecycle });
}

export function GET(request: Request) {
  return run(request);
}

export function POST(request: Request) {
  return run(request);
}
