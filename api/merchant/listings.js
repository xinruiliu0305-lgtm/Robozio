import { query } from "../../lib/db.js";
import { getSessionUser, getTokenFromRequest } from "../../lib/auth.js";

const parseMerchantId = (input) => {
  const id = Number(input);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const resolveAuthorizedMerchantId = async (req, res, merchantIdRaw) => {
  const token = getTokenFromRequest(req);
  const user = await getSessionUser(token);
  if (!user || (user.role !== "merchant" && user.role !== "admin")) {
    res.status(403).json({ error: "Seller or admin access required" });
    return null;
  }

  if (user.role === "admin") {
    const merchantId = parseMerchantId(merchantIdRaw);
    if (!merchantId) {
      res.status(400).json({ error: "merchantId is required" });
      return null;
    }
    return merchantId;
  }

  const merchantResult = await query(
    `SELECT id FROM merchants WHERE email = $1 LIMIT 1`,
    [String(user.email || "").toLowerCase()]
  );
  const merchantId = merchantResult.rows[0]?.id || null;
  if (!merchantId) {
    res.status(400).json({ error: "Merchant profile not found for current user" });
    return null;
  }
  return merchantId;
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    const merchantId = await resolveAuthorizedMerchantId(req, res, req.query.merchantId);
    if (!merchantId) return;
    try {
      const result = await query(
        `SELECT id, listing_type, title, category, summary, image_names, created_at
         FROM merchant_listings
         WHERE merchant_id = $1
         ORDER BY created_at DESC`,
        [merchantId]
      );
      return res.status(200).json({
        listings: result.rows.map((row) => ({
          id: row.id,
          type: row.listing_type,
          title: row.title,
          category: row.category,
          summary: row.summary,
          imageNames: row.image_names || [],
          createdAt: row.created_at
        }))
      });
    } catch (error) {
      return res.status(500).json({
        error: "Failed to load listings",
        details: error?.message || "Unknown error"
      });
    }
  }

  if (req.method === "POST") {
    const {
      merchantId: merchantIdRaw,
      listingType,
      title,
      category,
      summary,
      imageNames = []
    } = req.body || {};
    const merchantId = await resolveAuthorizedMerchantId(req, res, merchantIdRaw);
    if (!merchantId || !listingType || !title || !category || !summary) {
      return res.status(400).json({ error: "Missing required listing fields" });
    }

    try {
      const result = await query(
        `INSERT INTO merchant_listings (merchant_id, listing_type, title, category, summary, image_names)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb)
         RETURNING id, listing_type, title, category, summary, image_names, created_at`,
        [merchantId, listingType, title, category, summary, JSON.stringify(Array.isArray(imageNames) ? imageNames.slice(0, 5) : [])]
      );
      const row = result.rows[0];
      return res.status(201).json({
        listing: {
          id: row.id,
          type: row.listing_type,
          title: row.title,
          category: row.category,
          summary: row.summary,
          imageNames: row.image_names || [],
          createdAt: row.created_at
        }
      });
    } catch (error) {
      return res.status(500).json({
        error: "Failed to create listing",
        details: error?.message || "Unknown error"
      });
    }
  }

  if (req.method === "DELETE") {
    const { merchantId: merchantIdRaw, listingId: listingIdRaw } = req.body || {};
    const merchantId = await resolveAuthorizedMerchantId(req, res, merchantIdRaw);
    const listingId = parseMerchantId(listingIdRaw);
    if (!merchantId || !listingId) {
      return res.status(400).json({ error: "merchantId and listingId are required" });
    }

    try {
      await query(
        `DELETE FROM merchant_listings
         WHERE id = $1 AND merchant_id = $2`,
        [listingId, merchantId]
      );
      return res.status(200).json({ deleted: true });
    } catch (error) {
      return res.status(500).json({
        error: "Failed to delete listing",
        details: error?.message || "Unknown error"
      });
    }
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
