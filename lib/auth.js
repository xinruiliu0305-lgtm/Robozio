import crypto from "node:crypto";
import { query } from "./db.js";

const HASH_ALGO = "sha256";
const SCRYPT_COST = 64;

export const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, SCRYPT_COST).toString("hex");
  return `${salt}:${hash}`;
};

export const verifyPassword = (password, storedHash) => {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, hash] = storedHash.split(":");
  const candidate = crypto.scryptSync(password, salt, SCRYPT_COST).toString("hex");
  const hashBuffer = Buffer.from(hash, "hex");
  const candidateBuffer = Buffer.from(candidate, "hex");
  if (hashBuffer.length !== candidateBuffer.length) return false;
  return crypto.timingSafeEqual(hashBuffer, candidateBuffer);
};

export const createSessionToken = () => crypto.randomBytes(32).toString("hex");

export const hashToken = (token) =>
  crypto.createHash(HASH_ALGO).update(token).digest("hex");

export const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) return authHeader.replace("Bearer ", "").trim();
  return "";
};

export const getSessionUser = async (token) => {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const result = await query(
    `SELECT u.id, u.email, u.full_name, u.role
     FROM portal_sessions s
     JOIN portal_users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );
  return result.rows[0] || null;
};
