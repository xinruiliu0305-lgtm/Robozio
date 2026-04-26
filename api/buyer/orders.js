import { query } from "../../lib/db.js";
import { getSessionUser, getTokenFromRequest } from "../../lib/auth.js";

const requireBuyer = async (req, res) => {
  const token = getTokenFromRequest(req);
  const user = await getSessionUser(token);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  if (user.role !== "buyer") {
    res.status(403).json({ error: "Buyer role required" });
    return null;
  }
  return user;
};

export default async function handler(req, res) {
  try {
    const user = await requireBuyer(req, res);
    if (!user) return;

    if (req.method === "GET") {
      const orderId = Number(req.query.orderId || 0);
      if (Number.isInteger(orderId) && orderId > 0) {
        const orderResult = await query(
          `SELECT id, status, preference, budget, timeline, contact_time, created_at
           FROM buyer_orders
           WHERE id = $1 AND user_id = $2
           LIMIT 1`,
          [orderId, user.id]
        );
        const order = orderResult.rows[0];
        if (!order) return res.status(404).json({ error: "Order not found" });
        const itemsResult = await query(
          `SELECT id, product_name, supplier, qty, unit_price_text
           FROM buyer_order_items
           WHERE order_id = $1
           ORDER BY id ASC`,
          [orderId]
        );
        return res.status(200).json({
          order: {
            id: order.id,
            status: order.status,
            preference: order.preference,
            budget: order.budget,
            timeline: order.timeline,
            contactTime: order.contact_time,
            createdAt: order.created_at
          },
          items: itemsResult.rows.map((item) => ({
            id: item.id,
            productName: item.product_name,
            supplier: item.supplier,
            qty: item.qty,
            unitPriceText: item.unit_price_text
          }))
        });
      }
      const result = await query(
        `SELECT id, status, preference, budget, timeline, contact_time, created_at
         FROM buyer_orders
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [user.id]
      );
      return res.status(200).json({
        orders: result.rows.map((row) => ({
          id: row.id,
          status: row.status,
          preference: row.preference,
          budget: row.budget,
          timeline: row.timeline,
          contactTime: row.contact_time,
          createdAt: row.created_at
        }))
      });
    }

    if (req.method === "POST") {
      const { preference = "purchase", budget = "", timeline = "", contactTime = "" } = req.body || {};
      const cartResult = await query(
        `SELECT product_name, supplier, qty, unit_price_text
         FROM buyer_cart_items
         WHERE user_id = $1`,
        [user.id]
      );
      if (!cartResult.rows.length) {
        return res.status(400).json({ error: "Cart is empty" });
      }

      const orderResult = await query(
        `INSERT INTO buyer_orders (user_id, status, preference, budget, timeline, contact_time)
         VALUES ($1, 'submitted', $2, $3, $4, $5)
         RETURNING id`,
        [user.id, preference, budget, timeline, contactTime]
      );
      const orderId = orderResult.rows[0].id;

      for (const item of cartResult.rows) {
        await query(
          `INSERT INTO buyer_order_items (order_id, product_name, supplier, qty, unit_price_text)
           VALUES ($1, $2, $3, $4, $5)`,
          [orderId, item.product_name, item.supplier, item.qty, item.unit_price_text]
        );
      }

      await query(`DELETE FROM buyer_cart_items WHERE user_id = $1`, [user.id]);
      return res.status(201).json({ orderId });
    }

    if (req.method === "PATCH") {
      const { orderId, action } = req.body || {};
      const orderIdInt = Number(orderId);
      if (!Number.isInteger(orderIdInt) || orderIdInt <= 0 || action !== "cancel") {
        return res.status(400).json({ error: "Invalid cancel payload" });
      }

      const orderResult = await query(
        `SELECT id, status
         FROM buyer_orders
         WHERE id = $1 AND user_id = $2
         LIMIT 1`,
        [orderIdInt, user.id]
      );
      const order = orderResult.rows[0];
      if (!order) return res.status(404).json({ error: "Order not found" });
      if (order.status === "closed") {
        return res.status(400).json({ error: "Order already closed" });
      }

      await query(
        `UPDATE buyer_orders
         SET status = 'closed'
         WHERE id = $1 AND user_id = $2`,
        [orderIdInt, user.id]
      );
      return res.status(200).json({ cancelled: true, status: "closed" });
    }

    res.setHeader("Allow", "GET, POST, PATCH");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({ error: "Orders API failed", details: error?.message || "Unknown error" });
  }
}
