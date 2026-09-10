import { Pool } from "pg";
import { env } from "./env";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

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
