const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const migrationSql = fs.readFileSync(path.join(__dirname, "db", "migrations", "000_postgres_init.sql"), "utf8");
    console.log("Running migration...");
    await pool.query(migrationSql);
    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

runMigration();
