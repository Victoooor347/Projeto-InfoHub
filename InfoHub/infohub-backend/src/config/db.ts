import { Pool } from "pg";
import { env } from "./env";

/**
 * O banco do professor é compartilhado entre as duplas: cada dupla tem o
 * próprio schema (ex.: `dupla_victor_gaby`) dentro do mesmo database.
 *
 * A DATABASE_URL vem no formato do Prisma: `...?schema=dupla_victor_gaby`.
 * O driver `pg` IGNORA esse parâmetro — sem o tratamento abaixo, todas as
 * queries iam parar no schema `public`, que é de uso comum (e onde outras
 * duplas já têm tabelas com os mesmos nomes, como `cursos`).
 *
 * Aqui tiramos o `schema` da URL e passamos para o Postgres como
 * `search_path` da conexão, então toda query sem prefixo (SELECT * FROM
 * cursos) passa a enxergar SÓ o schema da dupla.
 */
function montarConfigConexao(databaseUrl: string) {
  const url = new URL(databaseUrl);
  const schema = url.searchParams.get("schema");
  url.searchParams.delete("schema");

  if (!schema) {
    return { connectionString: url.toString(), schema: null };
  }
  // nome vai direto num comando SQL — só aceita identificador simples
  if (!/^[a-z_][a-z0-9_]*$/i.test(schema)) {
    throw new Error(`Nome de schema inválido na DATABASE_URL: "${schema}"`);
  }
  return {
    connectionString: url.toString(),
    options: `-c search_path=${schema}`,
    schema,
  };
}

const { schema, ...configPool } = montarConfigConexao(env.DATABASE_URL);

/** Schema da dupla (vem do `?schema=` da DATABASE_URL), ou null se não informado. */
export const DB_SCHEMA = schema;

export const pool = new Pool(configPool);

pool.on("error", (err) => {
  // erro em um client ocioso do pool (ex.: conexão derrubada pelo banco)
  console.error("Erro inesperado no pool do Postgres:", err);
});

/**
 * Atalho para rodar uma query parametrizada.
 * Sempre usar placeholders ($1, $2, ...) — nunca concatenar strings no SQL.
 */
export interface SimpleQueryResult<T> {
  rows: T[];
  rowCount: number | null;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<SimpleQueryResult<T>> {
  const result = await pool.query(text, params);
  return { rows: result.rows as T[], rowCount: result.rowCount };
}
