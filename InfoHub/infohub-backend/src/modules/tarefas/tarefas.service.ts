import { query } from "../../config/db";
import { AppError } from "../../utils/AppError";
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
  const idPendente = await idDoStatus("Pendente");
  const r = await query<Tarefa>(
    `INSERT INTO tarefa (titulo, descricao, data_limite, id_equipe, id_etapa, id_status)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [input.titulo, input.descricao, input.data_limite, input.id_equipe, input.id_etapa, idPendente]
  );
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
  return r.rows[0];
}

/**
 * RF-14/RF-16: aluno líder anexa um entregável (arquivo ou link) a uma
 * tarefa; envio automaticamente marca a tarefa como "Entregue" e preserva
 * o histórico de versões (cada envio novo é uma linha nova em entregavel,
 * nada é sobrescrito).
 */
export async function enviarEntregavel(
  id_tarefa: number,
  id_usuario: number,
  arquivo_url: string,
  tipo?: string
) {
  await buscarTarefaPorId(id_tarefa);
  const idEntregue = await idDoStatus("Entregue");

  const r = await query(
    `INSERT INTO entregavel (arquivo_url, tipo, id_tarefa, id_usuario)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [arquivo_url, tipo ?? null, id_tarefa, id_usuario]
  );
  await query(`UPDATE tarefa SET id_status = $1 WHERE id_tarefa = $2`, [idEntregue, id_tarefa]);
  return r.rows[0];
}

export async function listarEntregaveis(id_tarefa?: number) {
  if (id_tarefa) {
    const r = await query(
      `SELECT * FROM entregavel WHERE id_tarefa = $1 ORDER BY data_envio DESC`,
      [id_tarefa]
    );
    return r.rows;
  }
  const r = await query(`SELECT * FROM entregavel ORDER BY data_envio DESC`);
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
