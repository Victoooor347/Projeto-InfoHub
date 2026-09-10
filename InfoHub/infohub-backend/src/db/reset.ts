import { pool } from "../config/db";

async function reset() {
  console.log("Recriando o schema 'public' (todos os dados serão apagados)...");
  await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  console.log("Schema recriado. Rode 'npm run db:migrate' em seguida.");
}

reset()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
