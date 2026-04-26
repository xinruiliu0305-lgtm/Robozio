import { unlink } from "node:fs/promises";
import path from "node:path";
import { query } from "../../lib/db.js";
import { getSessionUser, getTokenFromRequest } from "../../lib/auth.js";
import { deleteFromCloudinaryByUrl } from "../../lib/cloudinary.js";

const unauthorized = (res) => res.status(403).json({ error: "Admin access required" });

const getUploadDir = () =>
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { listingId, url } = req.body || {};
  const listingIdInt = Number(listingId);
  if (!Number.isInteger(listingIdInt) || listingIdInt <= 0 || !url) {
    return res.status(400).json({ error: "Invalid delete payload" });
  }

  try {
    const token = getTokenFromRequest(req);
    const user = await getSessionUser(token);
    if (!user || user.role !== "admin") return unauthorized(res);

    const listingResult = await query(
      `SELECT image_names FROM merchant_listings WHERE id = $1 LIMIT 1`,
      [listingIdInt]
    );
    const listing = listingResult.rows[0];
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    const nextUrls = (listing.image_names || []).filter((item) => item !== url);
    await query(
      `UPDATE merchant_listings
       SET image_names = $1::jsonb
       WHERE id = $2`,
      [JSON.stringify(nextUrls), listingIdInt]
    );

    const deletedOnCloudinary = await deleteFromCloudinaryByUrl(String(url));
    if (!deletedOnCloudinary && String(url).startsWith("/uploads/")) {
      const fileName = String(url).replace("/uploads/", "");
      const filePath = path.join(getUploadDir(), fileName);
      try {
        await unlink(filePath);
      } catch (_error) {
        // Ignore missing file; DB remains source of truth.
      }
    }

    return res.status(200).json({ deleted: true });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to delete media",
      details: error?.message || "Unknown error"
    });
  }
}
