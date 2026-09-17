import { query } from "../../config/db";
import { AppError } from "../../utils/AppError";
import { USUARIO_COLUNAS_PUBLICAS, type Usuario } from "../usuarios/usuarios.types";
import type { Equipe, Etapa } from "./equipes.types";

interface FiltroEquipes {
  busca?: string;
  area?: string;
  mentor?: number;
}

/**
 * Toda leitura de equipe passa por aqui — enriquece a linha com a posição
 * dela na própria jornada (etapa_atual_ordem/nome/padrao) e o tamanho
 * total dessa jornada (total_etapas), via JOIN/subquery. Isso evita que o
 * frontend precise fazer uma chamada extra por equipe só pra saber "em
 * que etapa ela está" e "ela já chegou no fim da jornada dela" — que
 * ficou mais caro de responder desde que etapa passou a ser por-equipe
 * (ver schema.sql, decisão 7).
 */
const EQUIPE_SELECT = `
  SELECT eq.*,
         et.ordem AS etapa_atual_ordem,
         et.nome AS etapa_atual_nome,
         et.padrao AS etapa_atual_padrao,
         (SELECT MAX(ordem) FROM etapa WHERE id_equipe = eq.id_equipe) AS total_etapas
  FROM equipe eq
  LEFT JOIN etapa et ON et.id_etapa = eq.id_etapa_atual AND et.id_equipe = eq.id_equipe
`;

export async function listarEquipes(filtro: FiltroEquipes = {}): Promise<Equipe[]> {
  const condicoes: string[] = [];
  const params: unknown[] = [];

  if (filtro.busca) {
    params.push(`%${filtro.busca}%`);
    condicoes.push(`(eq.nome_equipe ILIKE $${params.length} OR eq.nome_ideia ILIKE $${params.length})`);
  }
  if (filtro.area) {
    params.push(filtro.area);
    condicoes.push(`eq.area_ideia = $${params.length}`);
  }
  if (filtro.mentor) {
    params.push(filtro.mentor);
    condicoes.push(
      `eq.id_equipe IN (SELECT id_equipe FROM equipe_mentor WHERE id_usuario = $${params.length})`
    );
  }

  const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";
  const r = await query<Equipe>(`${EQUIPE_SELECT} ${where} ORDER BY eq.id_equipe`, params);
  return r.rows;
}

export async function buscarEquipePorId(id: number): Promise<Equipe> {
  const r = await query<Equipe>(`${EQUIPE_SELECT} WHERE eq.id_equipe = $1`, [id]);
  if (!r.rows[0]) throw AppError.notFound("Equipe não encontrada");
  return r.rows[0];
}

/**
 * Jornada da equipe (etapa é por-equipe agora, não mais um catálogo
 * global de 6 — ver schema.sql, decisão 7). Inclui as padrão (ordem 1-6)
 * e as extras que o mentor tiver criado (ordem 7+).
 */
export async function listarEtapasDaEquipe(id_equipe: number): Promise<Etapa[]> {
  const r = await query<Etapa>(`SELECT * FROM etapa WHERE id_equipe = $1 ORDER BY ordem`, [id_equipe]);
  return r.rows;
}

async function buscarEtapaAtualComOrdem(equipe: Equipe): Promise<Etapa> {
  const r = await query<Etapa>(`SELECT * FROM etapa WHERE id_etapa = $1 AND id_equipe = $2`, [
    equipe.id_etapa_atual,
    equipe.id_equipe,
  ]);
  if (!r.rows[0]) throw AppError.conflict("A equipe não tem uma etapa atual válida");
  return r.rows[0];
}

/**
 * "A jornada padrão segue com 6 etapas, mas o mentor pode acrescentar
 * etapas extras por equipe" (decisão do InfoHub via WhatsApp). Um mentor
 * DAQUELA equipe insere uma etapa nova ao final da jornada dela — nunca
 * no meio, pra não bagunçar a ordem de quem já passou por ali.
 */
export async function criarEtapaExtra(
  id_equipe: number,
  nome: string,
  descricao: string,
  criada_por: number
): Promise<Etapa> {
  await buscarEquipePorId(id_equipe);
  const maxOrdemR = await query<{ max: number }>(
    `SELECT COALESCE(MAX(ordem), 0) AS max FROM etapa WHERE id_equipe = $1`,
    [id_equipe]
  );
  const proximaOrdem = maxOrdemR.rows[0].max + 1;

  const r = await query<Etapa>(
    `INSERT INTO etapa (id_equipe, ordem, nome, descricao, padrao, criada_por)
     VALUES ($1,$2,$3,$4,FALSE,$5) RETURNING *`,
    [id_equipe, proximaOrdem, nome, descricao, criada_por]
  );
  return r.rows[0];
}

/**
 * RF-09: avançar ou retroceder manualmente a equipe entre as etapas da
 * JORNADA DELA (que pode ter mais de 6, se o mentor tiver acrescentado
 * etapas extras — não é mais um limite fixo em 6).
 */
export async function avancarEtapa(id: number, delta: 1 | -1): Promise<Equipe> {
  const equipe = await buscarEquipePorId(id);
  const etapaAtual = await buscarEtapaAtualComOrdem(equipe);

  const maxOrdemR = await query<{ max: number }>(
    `SELECT MAX(ordem) AS max FROM etapa WHERE id_equipe = $1`,
    [id]
  );
  const ultimaOrdem = maxOrdemR.rows[0].max;

  const proximaOrdem = Math.min(ultimaOrdem, Math.max(1, etapaAtual.ordem + delta));
  const proximaEtapaR = await query<Etapa>(`SELECT * FROM etapa WHERE id_equipe = $1 AND ordem = $2`, [
    id,
    proximaOrdem,
  ]);
  const proximaEtapa = proximaEtapaR.rows[0];

  // ao sair da última etapa da jornada, a equipe deixa de estar "pronta para o InovAMF"
  const pronto = proximaOrdem === ultimaOrdem ? equipe.pronto_para_inovamf : false;

  await query(`UPDATE equipe SET id_etapa_atual = $1, pronto_para_inovamf = $2 WHERE id_equipe = $3`, [
    proximaEtapa.id_etapa,
    pronto,
    id,
  ]);
  return buscarEquipePorId(id);
}


export async function marcarProntoParaInovAMF(id: number, pronto: boolean): Promise<Equipe> {
  const equipe = await buscarEquipePorId(id);
  const etapaAtual = await buscarEtapaAtualComOrdem(equipe);
  const maxOrdemR = await query<{ max: number }>(
    `SELECT MAX(ordem) AS max FROM etapa WHERE id_equipe = $1`,
    [id]
  );
  const ultimaOrdem = maxOrdemR.rows[0].max;

  if (etapaAtual.ordem !== ultimaOrdem) {
    throw AppError.conflict("Só é possível marcar como pronta uma equipe que está na última etapa da jornada dela");
  }
  await query(`UPDATE equipe SET pronto_para_inovamf = $1 WHERE id_equipe = $2`, [pronto, id]);
  return buscarEquipePorId(id);
}

/** Q3 do PDF de requisitos: pitch é só link do YouTube, sem upload de vídeo. */
export async function atualizarLinkPitch(id: number, link_pitch: string): Promise<Equipe> {
  await buscarEquipePorId(id);
  await query(`UPDATE equipe SET link_pitch = $1 WHERE id_equipe = $2`, [link_pitch, id]);
  return buscarEquipePorId(id);
}

/**
 * Integrantes da equipe já com os dados públicos do usuário.
 *
 * Existe para o aluno: ele não pode chamar GET /usuarios (restrito a
 * admin/mentor), mas precisa dos nomes dos colegas e de saber quem é o líder.
 * Devolve o vínculo (equipe_usuario) + o usuário aninhado, para o frontend
 * derivar as duas listas de uma vez só.
 */
export interface IntegranteDaEquipe {
  id_equipe_usuario: number;
  id_equipe: number;
  papel: "lider" | "integrante";
  usuario: Usuario;
}

export async function listarIntegrantesDaEquipe(id_equipe: number): Promise<IntegranteDaEquipe[]> {
  const r = await query<{
    id_equipe_usuario: number;
    id_equipe: number;
    papel: "lider" | "integrante";
    id_usuario: number;
    nome: string;
    telefone: string | null;
    email: string;
    perfil: Usuario["perfil"];
    id_curso: number | null;
    semestre: number | null;
    ativo: boolean;
    criado_em: string;
  }>(
    `SELECT eu.id_equipe_usuario, eu.id_equipe, eu.papel,
            u.id_usuario, u.nome, u.telefone, u.email, u.perfil,
            u.id_curso, u.semestre, u.ativo, u.criado_em
     FROM equipe_usuario eu
     JOIN usuario u ON u.id_usuario = eu.id_usuario
     WHERE eu.id_equipe = $1
     ORDER BY CASE WHEN eu.papel = 'lider' THEN 0 ELSE 1 END, u.nome`,
    [id_equipe]
  );

  return r.rows.map((row) => ({
    id_equipe_usuario: row.id_equipe_usuario,
    id_equipe: row.id_equipe,
    papel: row.papel,
    usuario: {
      id_usuario: row.id_usuario,
      nome: row.nome,
      telefone: row.telefone,
      email: row.email,
      perfil: row.perfil,
      id_curso: row.id_curso,
      semestre: row.semestre,
      ativo: row.ativo,
      criado_em: row.criado_em,
    },
  }));
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

/**
 * Confirma que uma etapa pertence à equipe informada, antes de deixar o
 * INSERT estourar a FK composta (etapa é por-equipe agora — ver decisão 7
 * do schema.sql). Dá um erro 409 legível em vez de um erro cru de FK do
 * Postgres.
 */
export async function validarEtapaPertenceEquipe(id_etapa: number, id_equipe: number): Promise<void> {
  const r = await query(`SELECT 1 FROM etapa WHERE id_etapa = $1 AND id_equipe = $2`, [
    id_etapa,
    id_equipe,
  ]);
  if ((r.rowCount ?? 0) === 0) {
    throw AppError.conflict("Essa etapa não pertence à jornada dessa equipe");
  }
}
