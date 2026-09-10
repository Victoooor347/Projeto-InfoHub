import { app } from "./app";
import { env } from "./config/env";
import { pool } from "./config/db";

async function start() {
  // falha rápido e com uma mensagem clara se o Postgres não estiver acessível
  try {
    await pool.query("SELECT 1");
  } catch (err) {
    console.error("Não foi possível conectar ao Postgres. Verifique DATABASE_URL no .env.");
    console.error(err);
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    console.log(`InfoHub API rodando em http://localhost:${env.PORT}`);
    console.log(`Healthcheck: http://localhost:${env.PORT}/health`);
  });
}

start();
