import Stripe from "stripe";
import { query } from "../lib/db.js";

const readRawBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

export const config = {
  api: { bodyParser: false }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return res.status(500).json({ error: "Missing Stripe webhook configuration" });
  }

  const stripe = new Stripe(secretKey);

  try {
    const signature = req.headers["stripe-signature"];
    const rawBody = await readRawBody(req);
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const merchantId = Number(session.metadata?.merchantId || 0);
      const paymentType = session.metadata?.paymentType || "";
      const paymentIntentId = session.payment_intent || null;

      if (merchantId && paymentType) {
        await query(
          `UPDATE merchant_payments
           SET payment_status = 'paid',
               stripe_payment_intent_id = $1,
               updated_at = NOW()
           WHERE stripe_session_id = $2`,
          [paymentIntentId, session.id]
        );

        const paidResult = await query(
          `SELECT payment_type, payment_status
           FROM merchant_payments
           WHERE merchant_id = $1`,
          [merchantId]
        );

        const hasOnboarding = paidResult.rows.some(
          (row) => row.payment_type === "onboarding" && row.payment_status === "paid"
        );
        const hasDeposit = paidResult.rows.some(
          (row) => row.payment_type === "deposit" && row.payment_status === "paid"
        );
        const nextStatus = hasOnboarding && hasDeposit ? "active" : "pending_payment";

        await query(
          `UPDATE merchants
           SET onboarding_status = $1,
               updated_at = NOW()
           WHERE id = $2`,
          [nextStatus, merchantId]
        );
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(400).json({
      error: "Webhook processing failed",
      details: error?.message || "Unknown error"
    });
  }
}
