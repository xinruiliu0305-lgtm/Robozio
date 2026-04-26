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

    const [users, merchants, listings, payments, buyerOrders] = await Promise.all([
      query(`SELECT id, email, full_name, role, created_at FROM portal_users ORDER BY created_at DESC LIMIT 100`),
      query(`SELECT id, company_name, email, onboarding_status, created_at FROM merchants ORDER BY created_at DESC LIMIT 100`),
      query(`SELECT l.id, l.title, l.listing_type, l.category, m.company_name, l.created_at
             FROM merchant_listings l
             JOIN merchants m ON m.id = l.merchant_id
             ORDER BY l.created_at DESC LIMIT 150`),
      query(`SELECT p.id, p.payment_type, p.payment_status, p.amount_minor, p.currency, p.created_at, m.company_name
             FROM merchant_payments p
             JOIN merchants m ON m.id = p.merchant_id
             ORDER BY p.created_at DESC LIMIT 150`),
      query(`SELECT o.id, o.status, o.preference, o.created_at, u.email
             FROM buyer_orders o
             JOIN portal_users u ON u.id = o.user_id
             ORDER BY o.created_at DESC LIMIT 150`)
    ]);

    return res.status(200).json({
      stats: {
        users: users.rowCount,
        merchants: merchants.rowCount,
        listings: listings.rowCount,
        payments: payments.rowCount,
        buyerOrders: buyerOrders.rowCount
      },
      users: users.rows,
      merchants: merchants.rows,
      listings: listings.rows,
      payments: payments.rows,
      buyerOrders: buyerOrders.rows
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to load admin overview",
      details: error?.message || "Unknown error"
    });
  }
}
