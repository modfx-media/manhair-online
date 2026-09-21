// One-time build script: generates placeholder reference photos for the
// /hair-preview/ style gallery via Gemini text-to-image, then points
// lib/hair-styles.ts at the generated files. Not part of the live
// request flow in app/api/hair-preview/route.ts.
//
// Requires GEMINI_API_KEY. Run with:
//   node --env-file=.env.local scripts/generate-hairstyle-images.ts

import { GoogleGenAI, createPartFromText, createUserContent } from "@google/genai";
import sharp from "sharp";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const MODEL = "gemini-3.1-flash-image";
const OUT_DIR = path.join(process.cwd(), "public", "hair-styles");
const HAIR_STYLES_FILE = path.join(process.cwd(), "lib", "hair-styles.ts");

const PROMPT_BASE =
  "A photorealistic front-facing studio photo of a man showing a men's hair " +
  "replacement system. Neutral gray studio background, even soft lighting, " +
  "sharp focus, no text or logos, no other people in frame. ";

type StyleEntry = { id: string; name: string; prompt: string };

const STYLES: StyleEntry[] = [
  {
    id: "lace-front-classic",
    name: "Classic Lace Front",
    prompt:
      PROMPT_BASE +
      "He is wearing a classic lace front hair system: a soft, natural, undetectable hairline with hair swept back neatly.",
  },
  {
    id: "skin-base-system",
    name: "Skin Base System",
    prompt:
      PROMPT_BASE +
      "He is wearing an ultra-thin polyurethane skin-base hair system, giving a scalp-close, natural skin-like look at the part and crown.",
  },
  {
    id: "french-lace-hairpiece",
    name: "French Lace Hairpiece",
    prompt:
      PROMPT_BASE +
      "He is wearing a breathable full French lace hairpiece, with fine lace visible at the hairline and natural hair movement.",
  },
  {
    id: "mono-lace-hairpiece",
    name: "Mono Lace Hairpiece",
    prompt:
      PROMPT_BASE +
      "He is wearing a reinforced mono lace top hair system with a realistic, natural parting.",
  },
  {
    id: "full-cut-toupee",
    name: "Full Cut Toupee",
    prompt:
      PROMPT_BASE +
      "He is wearing a dense, full-cut toupee giving thick, ready-to-style coverage across the crown.",
  },
  {
    id: "fine-welded-toupee",
    name: "Fine Welded Toupee",
    prompt:
      PROMPT_BASE +
      "He is wearing a fine, low-profile welded-base toupee with a subtle, close-to-scalp everyday finish.",
  },
  {
    id: "full-density-system",
    name: "Full Density System",
    prompt:
      PROMPT_BASE +
      "He is wearing a maximum-density hair replacement system for significant hair loss, thick full coverage from hairline to crown.",
  },
  {
    id: "non-surgical-replacement",
    name: "Non-Surgical Replacement",
    prompt:
      PROMPT_BASE +
      "He is wearing an everyday non-surgical hair replacement unit, with comfortable, natural, everyday-styled hair.",
  },
];

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/** Points each style's `image` field at /hair-styles/<id>.webp. */
async function updateHairStylesFile(generatedIds: Set<string>): Promise<void> {
  let source = await readFile(HAIR_STYLES_FILE, "utf8");

  for (const id of generatedIds) {
    const pattern = new RegExp(`(id: "${id}",[\\s\\S]*?image: )"[^"]*"`);
    const replacement = `$1"/hair-styles/${id}.webp"`;
    if (pattern.test(source)) {
      source = source.replace(pattern, replacement);
    } else {
      console.warn(`  ! Could not find an "image" field for id "${id}" in lib/hair-styles.ts`);
    }
  }

  await writeFile(HAIR_STYLES_FILE, source, "utf8");
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(
      "GEMINI_API_KEY is not set. Run with: node --env-file=.env.local scripts/generate-hairstyle-images.ts"
    );
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const ai = new GoogleGenAI({ apiKey });
  const readyIds = new Set<string>();

  for (const style of STYLES) {
    const outPath = path.join(OUT_DIR, `${style.id}.webp`);

    if (await fileExists(outPath)) {
      console.log(`[${style.id}] already exists, skipping`);
      readyIds.add(style.id);
      continue;
    }

    console.log(`[${style.id}] generating "${style.name}"...`);
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: createUserContent([createPartFromText(style.prompt)]),
      });

      const part = response.candidates?.[0]?.content?.parts?.find(
        (p) => p.inlineData?.data
      );
      if (!part?.inlineData?.data) {
        console.error(`[${style.id}] FAILED: Gemini returned no image`);
        continue;
      }

      const inputBuffer = Buffer.from(part.inlineData.data, "base64");
      const webpBuffer = await sharp(inputBuffer).webp({ quality: 90 }).toBuffer();
      await writeFile(outPath, webpBuffer);
      readyIds.add(style.id);
      console.log(`[${style.id}] saved to public/hair-styles/${style.id}.webp`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[${style.id}] FAILED: ${message}`);
    }
  }

  if (readyIds.size > 0) {
    await updateHairStylesFile(readyIds);
    console.log(`\nUpdated lib/hair-styles.ts for: ${[...readyIds].join(", ")}`);
  } else {
    console.log("\nNo images were generated or already present — lib/hair-styles.ts left unchanged.");
  }
}

main();
