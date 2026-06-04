// Apply a .sql file directly to the database.
// Run: node --env-file=.env.local scripts/apply-sql.mjs <path-to.sql>
import fs from "fs";
import path from "path";
import pg from "pg";

const file = process.argv[2];
if (!file) {
  console.error("Usage: apply-sql.mjs <path-to.sql>");
  process.exit(1);
}
const sql = fs.readFileSync(path.resolve(file), "utf8");

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log(`✅ Applied ${path.basename(file)}`);
} catch (e) {
  console.error(`❌ ${path.basename(file)} failed: ${e.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
