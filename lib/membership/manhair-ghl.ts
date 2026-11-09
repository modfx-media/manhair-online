import type { SalesStage } from "./types";
import type { AppEnv } from "./readiness";

/** Non-secret HighLevel ids verified for the ManHair location. Not an API credential. */
export const MANHAIR_GHL_LOCATION_ID = "jv4grExvok7omWurc4PE";
export const MANHAIR_MARKETING_PIPELINE_ID = "arkMXixdGM81H9FjL2gc";
export const MANHAIR_LEGACY_PIPELINE_ID = "nN1jyhFV5trEjTBGlc46";

export const MANHAIR_STAGE_IDS: Record<SalesStage, string> = {
  "New Leads": "6a222649-1e28-4ac5-b6eb-b0f80624911d",
  "Hot Leads": "6695bb51-2314-4cfc-8c0b-c1d54dc3d1ed",
  "Proposal Sent": "c37b7f54-f4a4-47aa-897b-d3a7577a0a58",
  "Phone Consult": "2241d975-fa06-4138-b33a-2333f5cd52fc",
  "Video Consultation": "118eff81-ca9d-481b-a00a-d8495fdfb461",
  "No show/Cancelled": "e4034e59-8a30-4648-bead-667f8d5a11a6",
  "Active Clients": "58fb7eaa-4fc7-47f3-b00c-392e4cbd91e8",
  "No Buy/Nurture": "4ee34d60-d48c-4455-b851-3ef989374a11",
  DND: "8dd0b5f8-9db1-43c9-89d3-831da9a70185",
};

export type GhlTarget =
  | { ok: false; reason: "no_token" | "wrong_location" | "legacy_pipeline" | "wrong_pipeline" | "stage_map_mismatch" }
  | { ok: true; locationId: string; pipelineId: string; stageMap: Record<SalesStage, string>; token: string };

export function resolveGhlTarget(env: AppEnv): GhlTarget {
  const token = env.GHL_API_TOKEN?.trim() || env.GHL_PRIVATE_TOKEN?.trim() || "";
  if (!token) return { ok: false, reason: "no_token" };
  const requestedLocation = env.GHL_LOCATION_ID?.trim();
  if (requestedLocation && requestedLocation !== MANHAIR_GHL_LOCATION_ID) return { ok: false, reason: "wrong_location" };
  const requestedPipeline = env.GHL_PIPELINE_ID?.trim();
  if (requestedPipeline === MANHAIR_LEGACY_PIPELINE_ID) return { ok: false, reason: "legacy_pipeline" };
  if (requestedPipeline && requestedPipeline !== MANHAIR_MARKETING_PIPELINE_ID) return { ok: false, reason: "wrong_pipeline" };
  const stageMap = resolveStageMap(env.GHL_STAGE_MAP);
  if (!stageMap) return { ok: false, reason: "stage_map_mismatch" };
  return {
    ok: true,
    locationId: MANHAIR_GHL_LOCATION_ID,
    pipelineId: MANHAIR_MARKETING_PIPELINE_ID,
    stageMap,
    token,
  };
}

function resolveStageMap(raw: string | undefined): Record<SalesStage, string> | null {
  if (!raw?.trim()) return { ...MANHAIR_STAGE_IDS };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const record = parsed as Record<string, unknown>;
    const next = { ...MANHAIR_STAGE_IDS };
    for (const stage of Object.keys(MANHAIR_STAGE_IDS) as SalesStage[]) {
      const value = record[stage];
      if (value === undefined) continue;
      if (typeof value !== "string" || value.trim() !== MANHAIR_STAGE_IDS[stage]) return null;
      next[stage] = value.trim();
    }
    return next;
  } catch {
    return null;
  }
}
