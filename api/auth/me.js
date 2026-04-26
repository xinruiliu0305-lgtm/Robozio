import { getTokenFromRequest, getSessionUser } from "../../lib/auth.js";
import { query } from "../../lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = getTokenFromRequest(req);
    const user = await getSessionUser(token);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const merchantResult = await query(
      `SELECT id, company_name, contact_name, email, phone, country, company_type, onboarding_status
       FROM merchants
       WHERE email = $1
       LIMIT 1`,
      [user.email]
    );
    const merchant = merchantResult.rows[0] || null;

    let listingCount = 0;
    let cartCount = 0;
    let orderCount = 0;
    if (merchant?.id) {
      const listingCountResult = await query(
        `SELECT COUNT(*)::int AS count
         FROM merchant_listings
         WHERE merchant_id = $1`,
        [merchant.id]
      );
      listingCount = listingCountResult.rows[0]?.count || 0;
    }
    if (user.role === "buyer") {
      const [cartResult, orderResult] = await Promise.all([
        query(`SELECT COUNT(*)::int AS count FROM buyer_cart_items WHERE user_id = $1`, [user.id]),
        query(`SELECT COUNT(*)::int AS count FROM buyer_orders WHERE user_id = $1`, [user.id])
      ]);
      cartCount = cartResult.rows[0]?.count || 0;
      orderCount = orderResult.rows[0]?.count || 0;
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      },
      merchant: merchant
        ? {
            id: merchant.id,
            companyName: merchant.company_name,
            contactName: merchant.contact_name,
            email: merchant.email,
            phone: merchant.phone,
            country: merchant.country,
            companyType: merchant.company_type,
            onboardingStatus: merchant.onboarding_status,
            listingCount
          }
        : null,
      buyer: user.role === "buyer"
        ? {
            cartCount,
            orderCount
          }
        : null
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to load account info",
      details: error?.message || "Unknown error"
    });
  }
}
