import { query } from "../../lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    companyName = "",
    contactName = "",
    email = "",
    phone = "",
    country = "",
    companyType = "manufacturer"
  } = req.body || {};

  if (!companyName || !contactName || !email || !phone || !country) {
    return res.status(400).json({ error: "Missing required merchant profile fields" });
  }

  try {
    const result = await query(
      `
      INSERT INTO merchants (company_name, contact_name, email, phone, country, company_type, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (email)
      DO UPDATE SET
        company_name = EXCLUDED.company_name,
        contact_name = EXCLUDED.contact_name,
        phone = EXCLUDED.phone,
        country = EXCLUDED.country,
        company_type = EXCLUDED.company_type,
        updated_at = NOW()
      RETURNING id, company_name, contact_name, email, phone, country, company_type, onboarding_status
      `,
      [companyName, contactName, email, phone, country, companyType]
    );

    return res.status(200).json({
      merchant: {
        id: result.rows[0].id,
        companyName: result.rows[0].company_name,
        contactName: result.rows[0].contact_name,
        email: result.rows[0].email,
        phone: result.rows[0].phone,
        country: result.rows[0].country,
        companyType: result.rows[0].company_type,
        onboardingStatus: result.rows[0].onboarding_status
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to register merchant profile",
      details: error?.message || "Unknown error"
    });
  }
}
