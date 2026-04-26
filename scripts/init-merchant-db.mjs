import { readFile } from "node:fs/promises";
import pg from "pg";

const { Client } = pg;

const run = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const sql = await readFile(new URL("./merchant-schema.sql", import.meta.url), "utf8");
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "disable" ? false : { rejectUnauthorized: false }
  });

  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Merchant database schema initialized.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
};

run().catch((error) => {
  console.error("Failed to initialize merchant database schema:", error.message);
  process.exit(1);
});
