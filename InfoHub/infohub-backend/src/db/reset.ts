import { DB_SCHEMA, pool } from "../config/db";

/**
 * Apaga TODAS as tabelas e tipos do InfoHub — somente dentro do schema da
 * dupla (search_path definido em config/db.ts).
 *
 * A versão antiga fazia `DROP SCHEMA public CASCADE`, o que no banco
 * compartilhado do professor apagaria o trabalho de TODAS as duplas.
 * Agora ela se recusa a rodar se não houver um schema próprio configurado.
 */
async function reset() {
  if (!DB_SCHEMA || DB_SCHEMA === "public") {
    throw new Error(
      "Recusado: a DATABASE_URL não tem ?schema=<schema-da-dupla>. " +
        "Sem isso o reset atingiria o schema public, que é compartilhado."
    );
  }

  console.log(`Apagando tabelas e tipos do InfoHub no schema "${DB_SCHEMA}"...`);
  await pool.query(`
    DROP TABLE IF EXISTS
      equipe_mentor, lembrete, anotacoes, entregavel, tarefa, status_tarefa,
      equipe_usuario, etapa, equipe, usuario, cursos
    CASCADE;
    DROP TYPE IF EXISTS
      curso_nome, perfil_usuario, area_ideia, estagio_ideia, como_conheceu,
      papel_equipe, status_tarefa_desc
    CASCADE;
  `);
  console.log("Pronto. Rode 'npm run db:migrate' em seguida.");
}

reset()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
