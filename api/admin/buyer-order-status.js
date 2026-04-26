import { query } from "../../lib/db.js";
import { getSessionUser, getTokenFromRequest } from "../../lib/auth.js";

const ALLOWED = new Set(["submitted", "processing", "quoted", "closed"]);
const NEXT_ALLOWED = {
  submitted: new Set(["processing", "closed"]),
  processing: new Set(["quoted", "closed"]),
  quoted: new Set(["closed"]),
  closed: new Set([])
};

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

    const currentResult = await query(
      `SELECT id, status FROM buyer_orders WHERE id = $1 LIMIT 1`,
      [orderId]
    );
    const current = currentResult.rows[0];
    if (!current) return res.status(404).json({ error: "Order not found" });
    if (current.status === status) {
      return res.status(200).json({ order: current });
    }
    if (!NEXT_ALLOWED[current.status]?.has(status)) {
      return res.status(400).json({
        error: `Invalid transition from ${current.status} to ${status}`
      });
    }

    const result = await query(
      `UPDATE buyer_orders
       SET status = $1
       WHERE id = $2
       RETURNING id, status`,
      [status, orderId]
    );
    return res.status(200).json({ order: result.rows[0] });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to update order status",
      details: error?.message || "Unknown error"
    });
  }
}
