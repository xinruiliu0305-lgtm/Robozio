import { query } from "../lib/db.js";
import { hashPassword } from "../lib/auth.js";

const getArgValue = (name) => {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
};

const run = async () => {
  const email = (getArgValue("--email") || "").trim().toLowerCase();
  const password = getArgValue("--password") || "";
  const fullName = (getArgValue("--name") || "RobotZio Admin").trim();

  if (!email || !password) {
    throw new Error("Usage: node scripts/create-admin.mjs --email <email> --password <password> [--name <name>]");
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const passwordHash = hashPassword(password);
  const result = await query(
    `INSERT INTO portal_users (email, full_name, password_hash, role, updated_at)
     VALUES ($1, $2, $3, 'admin', NOW())
     ON CONFLICT (email)
     DO UPDATE SET
       full_name = EXCLUDED.full_name,
       password_hash = EXCLUDED.password_hash,
       role = 'admin',
       updated_at = NOW()
     RETURNING id, email, full_name, role`,
    [email, fullName, passwordHash]
  );

  const user = result.rows[0];
  console.log(`Admin account ready: ${user.email} (id=${user.id}, role=${user.role})`);
};

run().catch((error) => {
  console.error("Failed to create admin account:", error.message);
  process.exit(1);
});
