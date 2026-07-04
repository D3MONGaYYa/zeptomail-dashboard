/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
    process.exit(1);
  }

  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  const client = new Client({
    connectionString,
    ssl: process.env.PGSSL === "false" ? false : { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query(sql);
    console.log("✔ Schema applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
