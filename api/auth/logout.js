import { getTokenFromRequest, hashToken } from "../../lib/auth.js";
import { query } from "../../lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(200).json({ loggedOut: true });
  }

  try {
    await query(`DELETE FROM portal_sessions WHERE token_hash = $1`, [hashToken(token)]);
    return res.status(200).json({ loggedOut: true });
  } catch (error) {
    return res.status(500).json({
      error: "Logout failed",
      details: error?.message || "Unknown error"
    });
  }
}
