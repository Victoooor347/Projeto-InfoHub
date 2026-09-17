import fs from "node:fs";
import path from "node:path";
import { pool } from "../config/db";

/**
 * Aplica src/db/migrations/002_etapas_por_equipe.sql — transforma um banco
 * que ainda está no schema antigo (etapa como catálogo global de 6 linhas)
 * no schema novo (etapa por equipe), sem perder dados.
 *
 * Só rode isto se o seu banco já estava em produção ANTES dessa mudança.
 * Um banco novo, criado do zero com `npm run db:migrate`, já nasce direto
 * no formato novo — não precisa (e não deve) rodar isto.
 *
 * O arquivo .sql já controla sua própria transação (BEGIN/COMMIT), então
 * este runner só executa o texto dele como está, sem embrulhar de novo.
 */
async function migrarEtapasPorEquipe() {
  const sqlPath = path.join(__dirname, "migrations", "002_etapas_por_equipe.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  console.log("Aplicando migração 002 (etapas por equipe) em", process.env.DATABASE_URL?.replace(/:[^:@]*@/, ":****@"));
  await pool.query(sql);
  console.log("Migração 002 aplicada com sucesso.");
}

migrarEtapasPorEquipe()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Falha na migração 002:", err);
    process.exit(1);
  });
