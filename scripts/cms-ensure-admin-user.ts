import crypto from "node:crypto";
import fs from "node:fs";
import { config as loadEnv } from "dotenv";
import { siteApex } from "../lib/cms/url";

loadEnv({ path: ".env.local" });
loadEnv();

function upsertEnvLocal(email: string, password: string) {
  const file = ".env.local";
  if (!fs.existsSync(file)) return;
  let env = fs.readFileSync(file, "utf8");
  const set = (key: string, value: string) => {
    const line = `${key}=${value}`;
    if (new RegExp(`^${key}=`, "m").test(env)) {
      env = env.replace(new RegExp(`^${key}=.*$`, "m"), line);
    } else {
      env += `\n${line}\n`;
    }
  };
  set("CMS_ADMIN_EMAIL", email);
  set("CMS_ADMIN_PASSWORD", password);
  fs.writeFileSync(file, env);
}

async function main() {
  if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
    throw new Error("DATABASE_URL and PAYLOAD_SECRET are required");
  }

  const email = process.env.CMS_ADMIN_EMAIL || `admin@${siteApex()}`;
  const password =
    process.env.CMS_ADMIN_PASSWORD || crypto.randomBytes(18).toString("base64url");

  const { getPayload } = await import("payload");
  const { default: config } = await import("../payload.config");
  const payload = await getPayload({ config });

  const found = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  });

  if (found.docs[0]) {
    await payload.update({
      collection: "users",
      id: found.docs[0].id,
      data: { password, name: "Admin" },
      overrideAccess: true,
    });
    console.log("updated user", email);
  } else {
    await payload.create({
      collection: "users",
      data: { email, password, name: "Admin" },
      overrideAccess: true,
    });
    console.log("created user", email);
  }

  upsertEnvLocal(email, password);
  console.log("credentials saved to .env.local (CMS_ADMIN_EMAIL / CMS_ADMIN_PASSWORD)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
