import fs from "node:fs";
import path from "node:path";
import { pool } from "../config/db";

async function migrate() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");

  console.log("Aplicando schema em", process.env.DATABASE_URL?.replace(/:[^:@]*@/, ":****@"));

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Schema aplicado com sucesso.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Falha ao aplicar schema, rollback feito.");
    throw err;
  } finally {
    client.release();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
