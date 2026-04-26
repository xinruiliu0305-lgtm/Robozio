import Stripe from "stripe";
import { query } from "../lib/db.js";

const getBaseUrl = (req) => {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY" });
  }

  const stripe = new Stripe(secretKey);
  const {
    paymentType,
    merchantId,
    merchantName,
    merchantEmail,
    listingsCount = 0
  } = req.body || {};

  const pricing = {
    onboarding: Number(process.env.MERCHANT_ONBOARDING_FEE || 1500),
    deposit: Number(process.env.MERCHANT_DEPOSIT_FEE || 3000)
  };

  if (!paymentType || !pricing[paymentType]) {
    return res.status(400).json({ error: "Invalid paymentType" });
  }

  const currency = (process.env.STRIPE_CURRENCY || "aed").toLowerCase();
  const amountAed = pricing[paymentType];
  const amountMinor = Math.round(amountAed * 100);
  const baseUrl = getBaseUrl(req);

  const lineItemName =
    paymentType === "onboarding"
      ? "RobotZio Merchant Onboarding Fee"
      : "RobotZio Merchant Security Deposit";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: merchantEmail || undefined,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: lineItemName,
              description: `Merchant: ${merchantName || "Unknown"}`
            },
            unit_amount: amountMinor
          },
          quantity: 1
        }
      ],
      metadata: {
        paymentType,
        merchantId: String(merchantId || ""),
        merchantName: merchantName || "",
        merchantEmail: merchantEmail || "",
        listingsCount: String(listingsCount || 0)
      },
      success_url: `${baseUrl}/merchant-portal.html?payment=success&type=${paymentType}`,
      cancel_url: `${baseUrl}/merchant-portal.html?payment=cancelled&type=${paymentType}`
    });

    if (merchantId) {
      await query(
        `INSERT INTO merchant_payments
         (merchant_id, payment_type, amount_minor, currency, stripe_session_id, payment_status, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'pending', NOW())`,
        [Number(merchantId), paymentType, amountMinor, currency, session.id]
      );
    }

    return res.status(200).json({ url: session.url });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to create checkout session",
      details: error?.message || "Unknown error"
    });
  }
}
