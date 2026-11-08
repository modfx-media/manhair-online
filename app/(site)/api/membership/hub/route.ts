import { handleHub } from "@/lib/membership/handlers";
import { currentStaffEmail, runtimeDeps } from "@/lib/membership/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const staff = await currentStaffEmail();
  return handleHub(request, runtimeDeps(staff.email));
}

export async function POST(request: Request) {
  const staff = await currentStaffEmail();
  return handleHub(request, runtimeDeps(staff.email));
}
