import { query } from "../../config/db";

export interface EquipeUsuario {
  id_equipe_usuario: number;
  id_equipe: number;
  id_usuario: number;
  papel: "lider" | "integrante";
}

export async function listarEquipeUsuarios(filtro: { id_equipe?: number; id_usuario?: number } = {}) {
  const condicoes: string[] = [];
  const params: unknown[] = [];
  if (filtro.id_equipe) {
    params.push(filtro.id_equipe);
    condicoes.push(`id_equipe = $${params.length}`);
  }
  if (filtro.id_usuario) {
    params.push(filtro.id_usuario);
    condicoes.push(`id_usuario = $${params.length}`);
  }
  const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";
  const r = await query<EquipeUsuario>(
    `SELECT id_equipe_usuario, id_equipe, id_usuario, papel FROM equipe_usuario ${where} ORDER BY id_equipe_usuario`,
    params
  );
  return r.rows;
}

export async function papelDoUsuarioNaEquipe(id_usuario: number, id_equipe: number) {
  const r = await query<{ papel: "lider" | "integrante" }>(
    `SELECT papel FROM equipe_usuario WHERE id_usuario = $1 AND id_equipe = $2`,
    [id_usuario, id_equipe]
  );
  return r.rows[0]?.papel ?? null;
}

export async function usuarioPertenceEquipe(id_usuario: number, id_equipe: number) {
  const papel = await papelDoUsuarioNaEquipe(id_usuario, id_equipe);
  return papel !== null;
}

/** Lista os ids de todas as equipes das quais um usuário participa (líder ou integrante). */
export async function getEquipesDoUsuario(id_usuario: number): Promise<number[]> {
  const r = await query<{ id_equipe: number }>(`SELECT id_equipe FROM equipe_usuario WHERE id_usuario = $1`, [
    id_usuario,
  ]);
  return r.rows.map((row) => row.id_equipe);
}
