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
      const result = await query(
        `SELECT id, product_name, supplier, qty, unit_price_text, product_url, created_at
         FROM buyer_cart_items
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [user.id]
      );
      return res.status(200).json({
        items: result.rows.map((row) => ({
          id: row.id,
          productName: row.product_name,
          supplier: row.supplier,
          qty: row.qty,
          unitPriceText: row.unit_price_text,
          productUrl: row.product_url,
          createdAt: row.created_at
        }))
      });
    }

    if (req.method === "POST") {
      const { productName, supplier = "Unknown Supplier", qty = 1, unitPriceText = "Request Quote", productUrl = "product.html" } = req.body || {};
      if (!productName) return res.status(400).json({ error: "productName is required" });
      const result = await query(
        `INSERT INTO buyer_cart_items (user_id, product_name, supplier, qty, unit_price_text, product_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, product_name, supplier, qty, unit_price_text, product_url, created_at`,
        [user.id, productName, supplier, Math.max(1, Number(qty) || 1), unitPriceText, productUrl]
      );
      const row = result.rows[0];
      return res.status(201).json({
        item: {
          id: row.id,
          productName: row.product_name,
          supplier: row.supplier,
          qty: row.qty,
          unitPriceText: row.unit_price_text,
          productUrl: row.product_url,
          createdAt: row.created_at
        }
      });
    }

    if (req.method === "DELETE") {
      const { itemId } = req.body || {};
      if (!itemId) {
        await query(`DELETE FROM buyer_cart_items WHERE user_id = $1`, [user.id]);
        return res.status(200).json({ cleared: true });
      }
      await query(`DELETE FROM buyer_cart_items WHERE id = $1 AND user_id = $2`, [Number(itemId), user.id]);
      return res.status(200).json({ deleted: true });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({ error: "Cart API failed", details: error?.message || "Unknown error" });
  }
}
