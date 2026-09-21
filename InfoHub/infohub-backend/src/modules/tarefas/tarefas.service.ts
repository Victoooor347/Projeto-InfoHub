import { pool, query } from "../../config/db";
import { agendarLembreteAutomatico } from "../lembretes/lembretes.service";
import { AppError } from "../../utils/AppError";
import { validarEtapaPertenceEquipe } from "../equipes/equipes.service";
import type { CriarTarefaInput } from "./tarefas.schemas";
import type { Tarefa } from "./tarefas.types";

interface FiltroTarefas {
  id_equipe?: number;
  id_status?: number;
}

export async function listarTarefas(filtro: FiltroTarefas = {}): Promise<Tarefa[]> {
  await marcarTarefasAtrasadas();

  const condicoes: string[] = [];
  const params: unknown[] = [];
  if (filtro.id_equipe) {
    params.push(filtro.id_equipe);
    condicoes.push(`id_equipe = $${params.length}`);
  }
  if (filtro.id_status) {
    params.push(filtro.id_status);
    condicoes.push(`id_status = $${params.length}`);
  }
  const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";
  const r = await query<Tarefa>(
    `SELECT * FROM tarefa ${where} ORDER BY data_limite`,
    params
  );
  return r.rows;
}

export async function buscarTarefaPorId(id: number): Promise<Tarefa> {
  const r = await query<Tarefa>(`SELECT * FROM tarefa WHERE id_tarefa = $1`, [id]);
  if (!r.rows[0]) throw AppError.notFound("Tarefa não encontrada");
  return r.rows[0];
}

async function idDoStatus(descricao: string): Promise<number> {
  const r = await query<{ id_status: number }>(`SELECT id_status FROM status_tarefa WHERE descricao = $1`, [
    descricao,
  ]);
  if (!r.rows[0]) throw AppError.conflict(`Status "${descricao}" não está cadastrado`);
  return r.rows[0].id_status;
}

/** RF-11/RF-12: criar tarefa para uma equipe, já entra como "Pendente". */
export async function criarTarefa(input: CriarTarefaInput): Promise<Tarefa> {
  await validarEtapaPertenceEquipe(input.id_etapa, input.id_equipe);
  const idPendente = await idDoStatus("Pendente");
  const r = await query<Tarefa>(
    `INSERT INTO tarefa (titulo, descricao, data_limite, id_equipe, id_etapa, id_status)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [input.titulo, input.descricao, input.data_limite, input.id_equipe, input.id_etapa, idPendente]
  );
  // lembrete automático por e-mail, N dias antes do prazo
  await agendarLembreteAutomatico(r.rows[0].id_tarefa);
  return r.rows[0];
}

/** RF-15: admin/mentor aprova ou pede ajuste; também usado para outras transições manuais de status. */
export async function atualizarStatus(id: number, id_status: number): Promise<Tarefa> {
  await buscarTarefaPorId(id);
  const r = await query<Tarefa>(`UPDATE tarefa SET id_status = $1 WHERE id_tarefa = $2 RETURNING *`, [
    id_status,
    id,
  ]);
  return r.rows[0];
}

/**
 * Esclarecido com o cliente: só o mentor pode alterar o prazo de uma
 * tarefa já criada. A checagem de permissão (quem é "mentor" o bastante
 * para mexer nessa tarefa) é feita no controller, que decide se o usuário
 * é mentor global ou mentor específico daquela equipe.
 */
export async function atualizarPrazo(id: number, data_limite: string): Promise<Tarefa> {
  await buscarTarefaPorId(id);
  const r = await query<Tarefa>(`UPDATE tarefa SET data_limite = $1 WHERE id_tarefa = $2 RETURNING *`, [
    data_limite,
    id,
  ]);
  // prazo mudou → o lembrete automático pendente acompanha a nova data
  await agendarLembreteAutomatico(id);
  return r.rows[0];
}

/**
 * RF-14/RF-16: aluno líder anexa um entregável (arquivo ou link) a uma
 * tarefa; envio automaticamente marca a tarefa como "Entregue" e preserva
 * o histórico de versões (cada envio novo é uma linha nova em entregavel,
 * nada é sobrescrito).
 */
/** Arquivo enviado pelo navegador, em base64 (ver enviarEntregavelSchema). */
export interface ArquivoEnviado {
  nome: string;
  tipo_mime: string;
  conteudo_base64: string;
}

export const TAMANHO_MAXIMO_ARQUIVO = 5 * 1024 * 1024; // 5 MB

const EXTENSOES_PERMITIDAS = [
  "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "odt", "odp", "ods",
  "txt", "csv", "png", "jpg", "jpeg", "gif", "webp", "zip",
];

function extensao(nome: string): string {
  const partes = nome.toLowerCase().split(".");
  return partes.length > 1 ? partes.pop()! : "";
}

export async function enviarEntregavel(
  id_tarefa: number,
  id_usuario: number,
  entrega: { arquivo_url?: string; tipo?: string; arquivo?: ArquivoEnviado }
) {
  const tarefa = await buscarTarefaPorId(id_tarefa);
  const idEntregue = await idDoStatus("Entregue");

  // valida o arquivo ANTES de abrir a transação
  let conteudo: Buffer | null = null;
  if (entrega.arquivo) {
    const ext = extensao(entrega.arquivo.nome);
    if (!EXTENSOES_PERMITIDAS.includes(ext)) {
      throw AppError.badRequest(
        `Tipo de arquivo não permitido (.${ext || "sem extensão"}). Use: ${EXTENSOES_PERMITIDAS.join(", ")}`
      );
    }
    conteudo = Buffer.from(entrega.arquivo.conteudo_base64, "base64");
    if (conteudo.length === 0) throw AppError.badRequest("O arquivo está vazio");
    if (conteudo.length > TAMANHO_MAXIMO_ARQUIVO) {
      throw AppError.badRequest("O arquivo passa do limite de 5 MB");
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let id_arquivo: number | null = null;
    let arquivo_url = entrega.arquivo_url ?? "";
    let tipo = entrega.tipo ?? null;

    if (entrega.arquivo && conteudo) {
      const a = await client.query<{ id_arquivo: number }>(
        `INSERT INTO arquivo (nome_original, tipo_mime, tamanho, conteudo, id_equipe, id_usuario)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id_arquivo`,
        [
          entrega.arquivo.nome.slice(0, 255),
          (entrega.arquivo.tipo_mime || "application/octet-stream").slice(0, 100),
          conteudo.length,
          conteudo,
          tarefa.id_equipe,
          id_usuario,
        ]
      );
      id_arquivo = a.rows[0].id_arquivo;
      arquivo_url = `/api/arquivos/${id_arquivo}`;
      tipo = extensao(entrega.arquivo.nome);
    }

    const r = await client.query<{ id_entregavel: number }>(
      `INSERT INTO entregavel (arquivo_url, tipo, id_tarefa, id_usuario, id_arquivo)
       VALUES ($1,$2,$3,$4,$5) RETURNING id_entregavel`,
      [arquivo_url, tipo, id_tarefa, id_usuario, id_arquivo]
    );
    await client.query(`UPDATE tarefa SET id_status = $1 WHERE id_tarefa = $2`, [idEntregue, id_tarefa]);
    await client.query("COMMIT");

    return buscarEntregavel(r.rows[0].id_entregavel);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/** Colunas do entregável + nome/tamanho do arquivo (nunca o conteúdo). */
const ENTREGAVEL_SELECT = `
  SELECT e.*, a.nome_original AS arquivo_nome, a.tamanho AS arquivo_tamanho
    FROM entregavel e
    LEFT JOIN arquivo a ON a.id_arquivo = e.id_arquivo`;

async function buscarEntregavel(id_entregavel: number) {
  const r = await query(`${ENTREGAVEL_SELECT} WHERE e.id_entregavel = $1`, [id_entregavel]);
  return r.rows[0];
}

export async function listarEntregaveis(id_tarefa?: number) {
  if (id_tarefa) {
    const r = await query(`${ENTREGAVEL_SELECT} WHERE e.id_tarefa = $1 ORDER BY e.data_envio DESC`, [id_tarefa]);
    return r.rows;
  }
  const r = await query(`${ENTREGAVEL_SELECT} ORDER BY e.data_envio DESC`);
  return r.rows;
}

/** Marca tarefas vencidas sem entrega como "Atrasada" (RN-04). Chamado sob demanda pela API. */
export async function marcarTarefasAtrasadas(): Promise<number> {
  const idAtrasada = await idDoStatus("Atrasada");
  const idPendente = await idDoStatus("Pendente");
  const idEmAndamento = await idDoStatus("Em andamento");
  const r = await query(
    `UPDATE tarefa SET id_status = $1
     WHERE data_limite < CURRENT_DATE AND id_status IN ($2, $3)`,
    [idAtrasada, idPendente, idEmAndamento]
  );
  return r.rowCount ?? 0;
}
