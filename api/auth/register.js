import { query } from "../../lib/db.js";
import { hashPassword } from "../../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { fullName = "", email = "", password = "", accountType = "buyer" } = req.body || {};
  if (!fullName || !email || !password || password.length < 8) {
    return res.status(400).json({ error: "Invalid registration data" });
  }

  try {
    const normalizedEmail = email.toLowerCase();
    const adminEmail = String(process.env.ADMIN_EMAIL || "").toLowerCase();
    const mappedRole =
      accountType === "seller" ? "merchant" : "buyer";
    const role = normalizedEmail && adminEmail && normalizedEmail === adminEmail ? "admin" : mappedRole;
    const passwordHash = hashPassword(password);
    const result = await query(
      `INSERT INTO portal_users (email, full_name, password_hash, role, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, email, full_name, role`,
      [normalizedEmail, fullName, passwordHash, role]
    );

    return res.status(201).json({
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        fullName: result.rows[0].full_name,
        role: result.rows[0].role
      }
    });
  } catch (error) {
    const isDuplicate =
      error?.message?.toLowerCase().includes("duplicate") ||
      error?.message?.toLowerCase().includes("unique");
    return res.status(isDuplicate ? 409 : 500).json({
      error: isDuplicate ? "Email already registered" : "Failed to register user",
      details: error?.message || "Unknown error"
    });
  }
}
