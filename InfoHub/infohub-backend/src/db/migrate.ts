import fs from "node:fs";
import path from "node:path";
import { DB_SCHEMA, pool } from "../config/db";

async function migrate() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");

  console.log("Aplicando schema em", process.env.DATABASE_URL?.replace(/:[^:@]*@/, ":****@"));

  const client = await pool.connect();
  try {
    // Confere ONDE as tabelas vão ser criadas antes de criar qualquer coisa.
    // current_schema() é null quando nenhum schema do search_path existe.
    const r = await client.query<{ atual: string | null }>(`SELECT current_schema() AS atual`);
    const atual = r.rows[0]?.atual;
    if (DB_SCHEMA && atual !== DB_SCHEMA) {
      throw new Error(
        `O schema "${DB_SCHEMA}" não existe neste banco (ou o usuário não tem acesso a ele). ` +
          `Peça ao professor para criá-lo — nada foi alterado.`
      );
    }
    console.log(`Schema de destino: ${atual}`);

    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Schema aplicado com sucesso.");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
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
