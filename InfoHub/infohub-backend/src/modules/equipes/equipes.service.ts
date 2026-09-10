import { query } from "../../config/db";
import { AppError } from "../../utils/AppError";
import { USUARIO_COLUNAS_PUBLICAS, type Usuario } from "../usuarios/usuarios.types";
import type { Equipe } from "./equipes.types";

interface FiltroEquipes {
  busca?: string;
  area?: string;
  mentor?: number;
}

export async function listarEquipes(filtro: FiltroEquipes = {}): Promise<Equipe[]> {
  const condicoes: string[] = [];
  const params: unknown[] = [];

  if (filtro.busca) {
    params.push(`%${filtro.busca}%`);
    condicoes.push(`(nome_equipe ILIKE $${params.length} OR nome_ideia ILIKE $${params.length})`);
  }
  if (filtro.area) {
    params.push(filtro.area);
    condicoes.push(`area_ideia = $${params.length}`);
  }
  if (filtro.mentor) {
    params.push(filtro.mentor);
    condicoes.push(
      `id_equipe IN (SELECT id_equipe FROM equipe_mentor WHERE id_usuario = $${params.length})`
    );
  }

  const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";
  const r = await query<Equipe>(`SELECT * FROM equipe ${where} ORDER BY id_equipe`, params);
  return r.rows;
}

export async function buscarEquipePorId(id: number): Promise<Equipe> {
  const r = await query<Equipe>(`SELECT * FROM equipe WHERE id_equipe = $1`, [id]);
  if (!r.rows[0]) throw AppError.notFound("Equipe não encontrada");
  return r.rows[0];
}

/** RF-09: avançar ou retroceder manualmente a equipe entre as etapas (1 a 6). */
export async function avancarEtapa(id: number, delta: 1 | -1): Promise<Equipe> {
  const equipe = await buscarEquipePorId(id);
  const proxima = Math.min(6, Math.max(1, equipe.id_etapa_atual + delta));
  // ao sair da etapa 6, a equipe deixa de estar "pronta para o InovAMF"
  const pronto = proxima === 6 ? equipe.pronto_para_inovamf : false;

  const r = await query<Equipe>(
    `UPDATE equipe SET id_etapa_atual = $1, pronto_para_inovamf = $2 WHERE id_equipe = $3 RETURNING *`,
    [proxima, pronto, id]
  );
  return r.rows[0];
}

export async function marcarProntoParaInovAMF(id: number, pronto: boolean): Promise<Equipe> {
  const equipe = await buscarEquipePorId(id);
  if (equipe.id_etapa_atual !== 6) {
    throw AppError.conflict("Só é possível marcar como pronta uma equipe que está na Etapa 6");
  }
  const r = await query<Equipe>(
    `UPDATE equipe SET pronto_para_inovamf = $1 WHERE id_equipe = $2 RETURNING *`,
    [pronto, id]
  );
  return r.rows[0];
}

/** Q3 do PDF de requisitos: pitch é só link do YouTube, sem upload de vídeo. */
export async function atualizarLinkPitch(id: number, link_pitch: string): Promise<Equipe> {
  await buscarEquipePorId(id);
  const r = await query<Equipe>(
    `UPDATE equipe SET link_pitch = $1 WHERE id_equipe = $2 RETURNING *`,
    [link_pitch, id]
  );
  return r.rows[0];
}

/** Uma equipe pode ter mais de um mentor (esclarecido com o cliente). */
export async function listarMentoresDaEquipe(id_equipe: number): Promise<Usuario[]> {
  const r = await query<Usuario>(
    `SELECT u.${USUARIO_COLUNAS_PUBLICAS.trim().split(",").join(", u.")}
     FROM equipe_mentor em
     JOIN usuario u ON u.id_usuario = em.id_usuario
     WHERE em.id_equipe = $1
     ORDER BY u.nome`,
    [id_equipe]
  );
  return r.rows;
}

/**
 * Admin ou mentor podem ser adicionados como mentor de uma equipe — não
 * precisa ter perfil='mentor' estritamente (ver conversa sobre "e se um
 * admin quiser ser mentor?"). Aluno nunca pode.
 */
export async function adicionarMentor(id_equipe: number, id_usuario: number) {
  await buscarEquipePorId(id_equipe);

  const usuarioR = await query<{ perfil: string }>(`SELECT perfil FROM usuario WHERE id_usuario = $1`, [
    id_usuario,
  ]);
  const usuario = usuarioR.rows[0];
  if (!usuario) throw AppError.notFound("Usuário não encontrado");
  if (usuario.perfil === "aluno") {
    throw AppError.conflict("Um aluno não pode ser mentor de uma equipe");
  }

  await query(
    `INSERT INTO equipe_mentor (id_equipe, id_usuario) VALUES ($1, $2)
     ON CONFLICT (id_equipe, id_usuario) DO NOTHING`,
    [id_equipe, id_usuario]
  );

  // mantém id_mentor (compatibilidade com o schema original) apontando pro
  // primeiro mentor, se ainda não houver nenhum
  await query(
    `UPDATE equipe SET id_mentor = $1 WHERE id_equipe = $2 AND id_mentor IS NULL`,
    [id_usuario, id_equipe]
  );

  return listarMentoresDaEquipe(id_equipe);
}

export async function removerMentor(id_equipe: number, id_usuario: number) {
  await buscarEquipePorId(id_equipe);
  await query(`DELETE FROM equipe_mentor WHERE id_equipe = $1 AND id_usuario = $2`, [
    id_equipe,
    id_usuario,
  ]);
  // se o mentor removido era o "principal", promove outro (se existir) ou zera
  const restantes = await listarMentoresDaEquipe(id_equipe);
  await query(`UPDATE equipe SET id_mentor = $1 WHERE id_equipe = $2`, [
    restantes[0]?.id_usuario ?? null,
    id_equipe,
  ]);
  return restantes;
}

/** Usado pela regra "só mentor da equipe pode alterar o prazo de uma tarefa". */
export async function usuarioEhMentorDaEquipe(id_usuario: number, id_equipe: number): Promise<boolean> {
  const r = await query(`SELECT 1 FROM equipe_mentor WHERE id_equipe = $1 AND id_usuario = $2`, [
    id_equipe,
    id_usuario,
  ]);
  return (r.rowCount ?? 0) > 0;
}
