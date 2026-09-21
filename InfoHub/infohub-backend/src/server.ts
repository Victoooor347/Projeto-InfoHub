import { app } from "./app";
import { env } from "./config/env";
import { pool } from "./config/db";
import { emailConfigurado } from "./services/email";
import { iniciarAgendadorDeLembretes } from "./modules/lembretes/lembretes.service";

async function start() {
  // falha rápido e com uma mensagem clara se o Postgres não estiver acessível
  try {
    await pool.query("SELECT 1");
  } catch (err) {
    console.error("Não foi possível conectar ao Postgres. Verifique DATABASE_URL no .env.");
    console.error(err);
    process.exit(1);
  }

  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`InfoHub API rodando em http://localhost:${env.PORT}`);
    console.log(`Healthcheck: http://localhost:${env.PORT}/health`);
    console.log(
      emailConfigurado
        ? `E-mail: SMTP ${env.SMTP_HOST}${env.EMAIL_TESTE_PARA ? ` (modo teste → ${env.EMAIL_TESTE_PARA})` : ""}`
        : "E-mail: modo simulação (sem SMTP configurado — os lembretes só aparecem no log)"
    );
  });

  // lembretes automáticos: confere na subida e depois de hora em hora
  iniciarAgendadorDeLembretes();
}

start();
