import crypto from "node:crypto";

const getConfig = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
  const apiKey = process.env.CLOUDINARY_API_KEY || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "robotzio";
  const enabled = Boolean(cloudName && apiKey && apiSecret);
  return { enabled, cloudName, apiKey, apiSecret, folder };
};

const buildSignature = (params, apiSecret) => {
  const base = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(base + apiSecret).digest("hex");
};

export const uploadToCloudinary = async ({ dataUrl, fileName = "upload" }) => {
  const cfg = getConfig();
  if (!cfg.enabled) return null;

  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${cfg.folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${fileName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 60)}`;
  const signParams = {
    folder: cfg.folder,
    public_id: publicId,
    timestamp
  };
  const signature = buildSignature(signParams, cfg.apiSecret);

  const form = new URLSearchParams();
  form.set("file", dataUrl);
  form.set("api_key", cfg.apiKey);
  form.set("timestamp", String(timestamp));
  form.set("signature", signature);
  form.set("folder", cfg.folder);
  form.set("public_id", publicId);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString()
    }
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cloudinary upload failed: ${text}`);
  }
  const payload = await response.json();
  return {
    url: payload.secure_url,
    publicId: payload.public_id
  };
};

const extractPublicIdFromUrl = (url) => {
  try {
    const u = new URL(url);
    const marker = "/upload/";
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return "";
    const tail = u.pathname.slice(idx + marker.length);
    const versionStripped = tail.replace(/^v\d+\//, "");
    return versionStripped.replace(/\.[^/.]+$/, "");
  } catch (_error) {
    return "";
  }
};

export const deleteFromCloudinaryByUrl = async (url) => {
  const cfg = getConfig();
  if (!cfg.enabled) return false;
  const publicId = extractPublicIdFromUrl(url);
  if (!publicId) return false;

  const timestamp = Math.floor(Date.now() / 1000);
  const signParams = {
    public_id: publicId,
    timestamp
  };
  const signature = buildSignature(signParams, cfg.apiSecret);

  const form = new URLSearchParams();
  form.set("public_id", publicId);
  form.set("api_key", cfg.apiKey);
  form.set("timestamp", String(timestamp));
  form.set("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/destroy`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString()
    }
  );
  return response.ok;
};
