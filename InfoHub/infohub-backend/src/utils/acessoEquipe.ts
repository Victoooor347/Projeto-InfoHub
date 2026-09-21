import { query } from "../config/db";
import { AppError } from "./AppError";

/**
 * Regra de acesso por perfil (seção 2 do documento de requisitos):
 *
 *  - admin  → enxerga e gerencia TODAS as equipes;
 *  - mentor → "permissões parecidas às do administrador, mas restrito às
 *             equipes sob sua mentoria" (vínculo na tabela equipe_mentor);
 *  - aluno  → só as equipes das quais participa (equipe_usuario).
 *
 * Todas as rotas que mexem com dados de uma equipe passam por aqui, para a
 * regra ficar num lugar só.
 */
export interface UsuarioLogado {
  id_usuario: number;
  perfil: "admin" | "mentor" | "aluno";
}

/**
 * Ids das equipes que o usuário pode ver.
 * `null` = sem restrição (admin vê tudo).
 */
export async function equipesVisiveis(usuario: UsuarioLogado): Promise<number[] | null> {
  if (usuario.perfil === "admin") return null;

  const r =
    usuario.perfil === "mentor"
      ? await query<{ id_equipe: number }>(`SELECT id_equipe FROM equipe_mentor WHERE id_usuario = $1`, [
          usuario.id_usuario,
        ])
      : await query<{ id_equipe: number }>(`SELECT id_equipe FROM equipe_usuario WHERE id_usuario = $1`, [
          usuario.id_usuario,
        ]);
  return r.rows.map((row) => row.id_equipe);
}

/** true se o usuário pode acessar a equipe (admin sempre pode). */
export async function podeAcessarEquipe(usuario: UsuarioLogado, id_equipe: number): Promise<boolean> {
  const visiveis = await equipesVisiveis(usuario);
  return visiveis === null || visiveis.includes(id_equipe);
}

/** Lança 403 se o usuário não puder acessar a equipe. */
export async function garantirAcessoEquipe(usuario: UsuarioLogado, id_equipe: number): Promise<void> {
  if (await podeAcessarEquipe(usuario, id_equipe)) return;
  throw AppError.forbidden(
    usuario.perfil === "mentor" ? "Você não é mentor desta equipe" : "Você não participa desta equipe"
  );
}

/** Filtra uma lista qualquer que tenha `id_equipe`, mantendo só o que o usuário pode ver. */
export async function filtrarPorEquipesVisiveis<T extends { id_equipe: number }>(
  usuario: UsuarioLogado,
  itens: T[]
): Promise<T[]> {
  const visiveis = await equipesVisiveis(usuario);
  if (visiveis === null) return itens;
  const permitidas = new Set(visiveis);
  return itens.filter((item) => permitidas.has(item.id_equipe));
}
