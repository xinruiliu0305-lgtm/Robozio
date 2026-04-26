import { query } from "../../lib/db.js";
import { getSessionUser, getTokenFromRequest } from "../../lib/auth.js";

const ALLOWED = new Set(["submitted", "processing", "quoted", "closed"]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = getTokenFromRequest(req);
    const user = await getSessionUser(token);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const orderId = Number(req.body?.orderId || 0);
    const status = String(req.body?.status || "");
    if (!Number.isInteger(orderId) || orderId <= 0 || !ALLOWED.has(status)) {
      return res.status(400).json({ error: "Invalid order status payload" });
    }

    const result = await query(
      `UPDATE buyer_orders
       SET status = $1
       WHERE id = $2
       RETURNING id, status`,
      [status, orderId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Order not found" });
    return res.status(200).json({ order: result.rows[0] });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to update order status",
      details: error?.message || "Unknown error"
    });
  }
}
