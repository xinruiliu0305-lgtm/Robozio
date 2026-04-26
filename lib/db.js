import pg from "pg";

const { Pool } = pg;

let pool;

export const getDbPool = () => {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "disable" ? false : { rejectUnauthorized: false }
    });
  }
  return pool;
};

export const query = async (text, params = []) => {
  const db = getDbPool();
  if (!db) {
    throw new Error("DATABASE_URL is not configured");
  }
  return db.query(text, params);
};
