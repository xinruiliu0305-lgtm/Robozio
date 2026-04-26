import { query } from "../../lib/db.js";
import {
  createSessionToken,
  hashToken,
  verifyPassword
} from "../../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email = "", password = "" } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const userResult = await query(
      `SELECT id, email, full_name, role, password_hash
       FROM portal_users
       WHERE email = $1
       LIMIT 1`,
      [email.toLowerCase()]
    );
    const user = userResult.rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = createSessionToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

    await query(
      `INSERT INTO portal_sessions (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: "Login failed",
      details: error?.message || "Unknown error"
    });
  }
}
