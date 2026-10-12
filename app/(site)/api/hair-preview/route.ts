import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  GoogleGenAI,
  createPartFromBase64,
  createPartFromText,
  createUserContent,
} from "@google/genai";
import { HAIR_STYLES } from "@/lib/hair-styles";
import { checkHairPreviewRateLimit, getClientIp } from "@/lib/rate-limit";

// Reads the reference style image from disk (fs) and calls an external API,
// so this must run on the Node.js runtime rather than the edge runtime.
export const runtime = "nodejs";

const MODEL = "gemini-3.1-flash-image";
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

const EXT_MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

function mimeTypeFromPath(filePath: string): string {
  return EXT_MIME_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

function errorResponse(message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ error: message }, { status, headers });
}

function buildPrompt(styleName: string): string {
  return [
    "You are editing a photo of a person to preview a men's hair replacement system.",
    `Apply the hair shape, length, and density from the second reference image ("${styleName}") onto the person in the first photo.`,
    "Preserve the person's exact face, facial features, skin tone, and the original lighting and background of the first photo.",
    "Blend the new hair naturally into their head shape and hairline.",
    "The output must be a single photorealistic image, indistinguishable from a real photograph — no illustration, cartoon, or painterly style.",
  ].join(" ");
}

export async function POST(request: Request) {
  const rateLimit = await checkHairPreviewRateLimit(getClientIp(request));
  if (rateLimit.limited) {
    return errorResponse(
      "You've reached today's limit of 3 preview generations. Please try again tomorrow.",
      429,
      { "Retry-After": String(rateLimit.retryAfterSeconds) }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("hair-preview: GEMINI_API_KEY is not set");
    return errorResponse("Preview generation is not configured.", 500);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Expected multipart/form-data with a photo and styleId.", 400);
  }

  const photo = formData.get("photo");
  const styleId = formData.get("styleId");

  if (!(photo instanceof File) || photo.size === 0) {
    return errorResponse("A photo is required.", 400);
  }
  if (!photo.type.startsWith("image/")) {
    return errorResponse("The uploaded photo must be an image file.", 400);
  }
  if (photo.size > MAX_PHOTO_BYTES) {
    return errorResponse("The uploaded photo must be smaller than 8MB.", 413);
  }
  if (typeof styleId !== "string" || !styleId) {
    return errorResponse("A styleId is required.", 400);
  }

  const style = HAIR_STYLES.find((s) => s.id === styleId);
  if (!style) {
    return errorResponse(`Unknown styleId: ${styleId}`, 400);
  }

  let referenceBase64: string;
  let referenceMimeType: string;
  try {
    const referencePath = path.join(process.cwd(), "public", style.image);
    referenceBase64 = (await readFile(referencePath)).toString("base64");
    referenceMimeType = mimeTypeFromPath(style.image);
  } catch (err) {
    console.error("hair-preview: failed to read reference style image", err);
    return errorResponse("Reference style image is unavailable.", 500);
  }

  const photoBase64 = Buffer.from(await photo.arrayBuffer()).toString("base64");

  const ai = new GoogleGenAI({ apiKey });

  let response;
  try {
    response = await ai.models.generateContent({
      model: MODEL,
      contents: createUserContent([
        createPartFromText(buildPrompt(style.name)),
        createPartFromText("Photo of the person:"),
        createPartFromBase64(photoBase64, photo.type),
        createPartFromText(`Reference hairstyle (${style.name}):`),
        createPartFromBase64(referenceBase64, referenceMimeType),
      ]),
    });
  } catch (err) {
    console.error("hair-preview: Gemini API request failed", err);
    return errorResponse("Preview generation failed. Please try again.", 502);
  }

  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData?.data
  );

  if (!imagePart?.inlineData?.data) {
    console.error(
      "hair-preview: Gemini response contained no image",
      response.promptFeedback ?? response.candidates?.[0]?.finishReason
    );
    return errorResponse("Preview generation did not return an image.", 502);
  }

  return NextResponse.json({
    image: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType ?? "image/png",
    styleId: style.id,
  });
}
