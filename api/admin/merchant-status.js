import { query } from "../../lib/db.js";
import { getSessionUser, getTokenFromRequest } from "../../lib/auth.js";

const ALLOWED = new Set(["draft", "pending_payment", "active", "suspended"]);

const unauthorized = (res) => res.status(403).json({ error: "Admin access required" });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { merchantId, onboardingStatus } = req.body || {};
  const merchantIdInt = Number(merchantId);
  if (!Number.isInteger(merchantIdInt) || merchantIdInt <= 0 || !ALLOWED.has(onboardingStatus)) {
    return res.status(400).json({ error: "Invalid merchant status payload" });
  }

  try {
    const token = getTokenFromRequest(req);
    const user = await getSessionUser(token);
    if (!user || user.role !== "admin") return unauthorized(res);

    const result = await query(
      `UPDATE merchants
       SET onboarding_status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, company_name, onboarding_status`,
      [onboardingStatus, merchantIdInt]
    );

    if (!result.rows[0]) return res.status(404).json({ error: "Merchant not found" });
    return res.status(200).json({ merchant: result.rows[0] });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to update merchant status",
      details: error?.message || "Unknown error"
    });
  }
}
