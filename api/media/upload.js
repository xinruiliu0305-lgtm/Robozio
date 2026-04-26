import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { uploadToCloudinary } from "../../lib/cloudinary.js";

const MAX_IMAGES = 5;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const sanitizeFileName = (name) =>
  String(name || "image")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

const getUploadDir = () =>
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

const decodeDataUrl = (dataUrl) => {
  const match = String(dataUrl || "").match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64")
  };
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const images = Array.isArray(req.body?.images) ? req.body.images : [];
  if (!images.length) return res.status(400).json({ error: "No images provided" });
  if (images.length > MAX_IMAGES) return res.status(400).json({ error: `Max ${MAX_IMAGES} images allowed` });

  try {
    const uploadDir = getUploadDir();
    await mkdir(uploadDir, { recursive: true });
    const uploaded = [];
    for (const image of images) {
      const decoded = decodeDataUrl(image?.dataUrl);
      if (!decoded) {
        return res.status(400).json({ error: "Invalid image payload" });
      }
      if (decoded.buffer.length > MAX_SIZE_BYTES) {
        return res.status(400).json({ error: "Image exceeds 5MB size limit" });
      }
      const extension = decoded.mimeType.includes("png")
        ? "png"
        : decoded.mimeType.includes("webp")
          ? "webp"
          : "jpg";
      const baseName = sanitizeFileName(image?.name || "upload");
      const cloudinaryUpload = await uploadToCloudinary({
        dataUrl: image?.dataUrl,
        fileName: baseName
      });

      if (cloudinaryUpload?.url) {
        uploaded.push({
          fileName: baseName,
          url: cloudinaryUpload.url
        });
      } else {
        const finalName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${baseName}.${extension}`;
        const filePath = path.join(uploadDir, finalName);
        await writeFile(filePath, decoded.buffer);
        uploaded.push({
          fileName: finalName,
          url: `/uploads/${finalName}`
        });
      }
    }

    return res.status(200).json({ images: uploaded });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to upload images",
      details: error?.message || "Unknown error"
    });
  }
}
