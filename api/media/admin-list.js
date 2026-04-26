import { query } from "../../lib/db.js";
import { getSessionUser, getTokenFromRequest } from "../../lib/auth.js";

const unauthorized = (res) => res.status(403).json({ error: "Admin access required" });

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = getTokenFromRequest(req);
    const user = await getSessionUser(token);
    if (!user || user.role !== "admin") return unauthorized(res);

    const result = await query(
      `SELECT l.id, l.title, l.image_names, m.company_name
       FROM merchant_listings l
       JOIN merchants m ON m.id = l.merchant_id
       WHERE jsonb_array_length(l.image_names) > 0
       ORDER BY l.created_at DESC
       LIMIT 200`
    );

    const media = result.rows.flatMap((row) =>
      (row.image_names || []).map((url) => ({
        listingId: row.id,
        listingTitle: row.title,
        companyName: row.company_name,
        url
      }))
    );

    return res.status(200).json({ media });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to load media list",
      details: error?.message || "Unknown error"
    });
  }
}
