import catalog from "./lifecycle-catalog.json";
import { businessIdentity, emailComplianceFooter } from "./business";
import type { AppEnv } from "./readiness";

export type LifecycleTemplate = {
  id: string;
  event_trigger: string;
  channel: "email" | "sms";
  audience: "member" | "staff";
  timing: string;
  enabled_phase: number;
  enabled: boolean;
  subject: string | null;
  preheader: string | null;
  body_html: string | null;
  body_text: string | null;
  sms_body: string | null;
  replaces: string | null;
  notes: string | null;
};

const OPTIONAL_VARS = new Set([
  "card_last4",
  "invoice_url",
  "lead_message",
  "lead_preferred_contact",
  "pause_decline_reason",
  "ghl_error",
]);

export function lifecycleTemplates(): LifecycleTemplate[] {
  return catalog.templates as LifecycleTemplate[];
}

export function lifecycleTemplate(id: string): LifecycleTemplate | null {
  return lifecycleTemplates().find((template) => template.id === id) ?? null;
}

export function phase1Templates(): LifecycleTemplate[] {
  return lifecycleTemplates().filter((template) => template.enabled_phase === 1);
}

/** Owner switch for the catalog, which ships with every template enabled=false. Phase 2 never sends. */
export function templateMaySend(templateId: string, env: AppEnv, purpose: "welcome" | "operational" | "lifecycle"): boolean {
  const template = lifecycleTemplate(templateId);
  if (!template || template.enabled_phase !== 1) return false;
  const disabled = new Set(
    (env.MEMBERSHIP_LIFECYCLE_DISABLED ?? "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
  );
  if (disabled.has(template.id)) return false;
  if (purpose === "welcome" || purpose === "operational") return true;
  if (env.MEMBERSHIP_LIFECYCLE_SEND !== "true") return false;
  return template.enabled === true || env.MEMBERSHIP_LIFECYCLE_PHASE1 === "true";
}

export type RenderedMessage = {
  subject: string;
  text: string;
  html: string;
  sms: string | null;
};

export function renderLifecycleTemplate(
  templateId: string,
  vars: Record<string, string>,
  env: AppEnv,
): { ok: true; message: RenderedMessage } | { ok: false; reason: "unknown_template" | "unresolved"; missing: string[] } {
  const template = lifecycleTemplate(templateId);
  if (!template) return { ok: false, reason: "unknown_template", missing: [] };
  const flags = { ...vars };
  const subject = fill(template.subject ?? "", flags, false);
  const preheader = fill(template.preheader ?? "", flags, false);
  const textBody = fill(template.body_text ?? "", flags, false);
  const htmlBody = fill(template.body_html ?? "", flags, true);
  const sms = template.sms_body ? fill(template.sms_body, flags, false) : { text: "", missing: [] as string[] };
  const missing = [...new Set([...subject.missing, ...preheader.missing, ...textBody.missing, ...htmlBody.missing, ...sms.missing])];
  if (missing.length) return { ok: false, reason: "unresolved", missing };
  const identity = businessIdentity(env);
  const manageUrl = vars.account_url || "https://www.manhaironline.com/account/";
  const footer = emailComplianceFooter({ identity, manageUrl });
  const text = [textBody.text.trim(), footer].filter(Boolean).join("\n\n");
  const html = wrapEmail(styleButtons(htmlBody.text), escapeHtml(preheader.text), footerHtml(identity, manageUrl));
  return {
    ok: true,
    message: { subject: subject.text.trim(), text, html, sms: template.channel === "sms" ? sms.text.trim() : template.sms_body ? sms.text.trim() : null },
  };
}

function fill(source: string, vars: Record<string, string>, html: boolean): { text: string; missing: string[] } {
  let text = applyConditionals(source, vars);
  text = dropOptional(text, vars);
  text = text.replace(/<p>\s*<\/p>/g, "");
  const missing: string[] = [];
  text = text.replace(/\{\{([a-z0-9_]+)\}\}/g, (_match, key: string) => {
    const value = vars[key];
    if (!value?.trim()) {
      missing.push(key);
      return "";
    }
    return html ? escapeHtml(value) : value;
  });
  return { text: text.replace(/[ \t]{2,}/g, " ").replace(/ +\n/g, "\n"), missing };
}

function applyConditionals(source: string, vars: Record<string, string>): string {
  const withElse = source.replace(/\[\[IF ([a-z0-9_]+)\]\]([\s\S]*?)\[\[ELSE\]\]([\s\S]*?)\[\[\/IF\]\]/g, (_match, key: string, yes: string, no: string) =>
    truthy(vars[key]) ? yes : no,
  );
  return withElse.replace(/\[\[IF ([a-z0-9_]+)\]\]([\s\S]*?)\[\[\/IF\]\]/g, (_match, key: string, yes: string) => (truthy(vars[key]) ? yes : ""));
}

function truthy(value: string | undefined): boolean {
  const trimmed = value?.trim().toLowerCase() ?? "";
  return trimmed !== "" && trimmed !== "false" && trimmed !== "0" && trimmed !== "no";
}

function dropOptional(source: string, vars: Record<string, string>): string {
  let text = source;
  for (const key of OPTIONAL_VARS) {
    if (vars[key]?.trim()) continue;
    const token = `{{${key}}}`;
    if (!text.includes(token)) continue;
    text = text.replaceAll(`, card ending ${token}`, "");
    text = text.replaceAll(` card ending ${token}`, "");
    text = text.replaceAll(`to the card ending ${token}`, "to your card");
    const lines = text.split("\n").flatMap((line) => {
      if (!line.includes(token)) return [line];
      if (/view invoice/i.test(line) || line.trim() === token) return [];
      const without = line.replaceAll(token, "").replace(/\s{2,}/g, " ").trim();
      if (/^[-•*]?\s*[\w\s]{0,40}:?\s*$/.test(without)) return [];
      return [line.replaceAll(token, "").replace(/[ \t]{2,}/g, " ")];
    });
    text = lines.join("\n");
    text = text.replace(new RegExp(`<p>\\s*${token}\\s*</p>`, "g"), "");
    text = text.replaceAll(token, "");
  }
  return text;
}

function styleButtons(fragment: string): string {
  return fragment.replaceAll(
    '<a class="mh-button"',
    '<a class="mh-button" style="background:#1a130e;color:#faf7f1;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;padding:12px 18px;display:inline-block;"',
  );
}

function footerHtml(identity: ReturnType<typeof businessIdentity>, manageUrl: string): string {
  const lines = [identity.legalName, identity.publicAddress, identity.publicPhone, identity.supportEmail]
    .filter((line): line is string => Boolean(line))
    .map((line) => escapeHtml(line));
  lines.push(`Manage your membership: <a href="${escapeHtml(manageUrl)}">${escapeHtml(manageUrl)}</a>`);
  return lines.join("<br>");
}

function wrapEmail(fragment: string, preheader: string, footer: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;background:#faf7f1;color:#1a130e;">
  <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;font-family:Georgia,'Times New Roman',serif;">
    <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#8a6a32;">ManHair</p>
    <div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;">${fragment}</div>
    <p style="font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#6b5c4a;">${footer}</p>
  </div>
</body></html>`;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
