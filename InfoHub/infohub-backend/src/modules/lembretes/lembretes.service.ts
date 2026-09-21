import { query } from "../../config/db";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { enviarEmail, escaparHtml, type ModoEnvio } from "../../services/email";

/**
 * Lembretes por e-mail (seção 2 dos requisitos: o admin "envia lembretes"
 * e o aluno "recebe lembretes por e-mail").
 *
 *  - Automático: toda tarefa nova ganha um lembrete agendado para
 *    LEMBRETE_DIAS_ANTES dias antes do prazo. Um agendador (server.ts)
 *    confere de hora em hora e envia os que venceram.
 *  - Manual: o botão "Disparar lembrete" do admin/mentor envia na hora.
 *
 * O e-mail vai para todos os integrantes ativos da equipe (líder + colegas).
 */

const STATUS_CONCLUIDOS = ["Entregue", "Aprovada"];

interface DadosTarefa {
  id_tarefa: number;
  titulo: string;
  descricao: string;
  prazo: string; // DD/MM/AAAA
  dias_restantes: number;
  status: string;
  nome_equipe: string;
  nome_etapa: string;
}

async function carregarTarefa(id_tarefa: number): Promise<DadosTarefa> {
  const r = await query<DadosTarefa>(
    `SELECT t.id_tarefa, t.titulo, t.descricao,
            to_char(t.data_limite, 'DD/MM/YYYY') AS prazo,
            (t.data_limite - CURRENT_DATE)::int AS dias_restantes,
            s.descricao AS status, e.nome_equipe, et.nome AS nome_etapa
       FROM tarefa t
       JOIN status_tarefa s ON s.id_status = t.id_status
       JOIN equipe e ON e.id_equipe = t.id_equipe
       JOIN etapa et ON et.id_etapa = t.id_etapa
      WHERE t.id_tarefa = $1`,
    [id_tarefa]
  );
  if (!r.rows[0]) throw AppError.notFound("Tarefa não encontrada");
  return r.rows[0];
}

async function emailsDaEquipe(id_tarefa: number): Promise<string[]> {
  const r = await query<{ email: string }>(
    `SELECT u.email
       FROM tarefa t
       JOIN equipe_usuario eu ON eu.id_equipe = t.id_equipe
       JOIN usuario u ON u.id_usuario = eu.id_usuario
      WHERE t.id_tarefa = $1 AND u.ativo = TRUE
      ORDER BY eu.papel, u.nome`,
    [id_tarefa]
  );
  return r.rows.map((row) => row.email);
}

function descreverPrazo(dias: number): string {
  if (dias < 0) return `venceu há ${Math.abs(dias)} dia(s)`;
  if (dias === 0) return "vence HOJE";
  if (dias === 1) return "vence AMANHÃ";
  return `vence em ${dias} dias`;
}

function montarEmail(t: DadosTarefa) {
  const situacao = descreverPrazo(t.dias_restantes);
  const link = env.APP_URL ? `${env.APP_URL.replace(/\/+$/, "")}/aluno/tarefas/${t.id_tarefa}` : null;
  const assunto = `[InfoHub] Lembrete: "${t.titulo}" ${situacao}`;

  const texto = [
    `Olá, equipe ${t.nome_equipe}!`,
    ``,
    `A tarefa "${t.titulo}" (${t.nome_etapa}) ${situacao} — prazo ${t.prazo}.`,
    `Status atual: ${t.status}.`,
    ``,
    t.descricao,
    ``,
    link ? `Acesse: ${link}` : `Acesse o InfoHub para enviar a entrega.`,
    ``,
    `— Equipe InfoHub`,
  ].join("\n");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#1f2937">
    <h2 style="color:#ea580c;margin-bottom:4px">Lembrete de tarefa</h2>
    <p style="margin-top:0;color:#6b7280">Equipe ${escaparHtml(t.nome_equipe)} · ${escaparHtml(t.nome_etapa)}</p>
    <p>A tarefa <strong>${escaparHtml(t.titulo)}</strong> <strong>${situacao}</strong>
       (prazo <strong>${t.prazo}</strong>).</p>
    <p style="color:#6b7280">Status atual: ${escaparHtml(t.status)}</p>
    <p style="background:#f9fafb;border-radius:8px;padding:12px">${escaparHtml(t.descricao)}</p>
    ${
      link
        ? `<p><a href="${escaparHtml(link)}" style="background:#ea580c;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block">Abrir no InfoHub</a></p>`
        : `<p>Acesse o InfoHub para enviar a entrega.</p>`
    }
    <p style="color:#9ca3af;font-size:12px">Você recebeu este e-mail por fazer parte da equipe no programa InfoHub → InovAMF.</p>
  </div>`;

  return { assunto, texto, html };
}

async function enviarParaEquipe(id_tarefa: number): Promise<{ modo: ModoEnvio; destinatarios: number }> {
  const tarefa = await carregarTarefa(id_tarefa);
  const para = await emailsDaEquipe(id_tarefa);
  if (para.length === 0) throw AppError.conflict("A equipe desta tarefa não tem integrantes ativos para avisar");
  const modo = await enviarEmail({ para, ...montarEmail(tarefa) });
  return { modo, destinatarios: para.length };
}

/** Botão "Disparar lembrete": envia agora e registra o lembrete como enviado. */
export async function dispararLembreteManual(id_tarefa: number) {
  const { modo, destinatarios } = await enviarParaEquipe(id_tarefa);
  const r = await query(
    `INSERT INTO lembrete (data_programada, enviado, id_tarefa, enviado_em, destinatarios, modo_envio)
     VALUES (CURRENT_DATE, TRUE, $1, now(), $2, $3) RETURNING *`,
    [id_tarefa, destinatarios, modo]
  );
  return r.rows[0];
}

/**
 * Agenda (ou reagenda) o lembrete automático da tarefa: N dias antes do
 * prazo, ou hoje mesmo se o prazo já estiver mais perto que isso. Lembretes
 * automáticos ainda NÃO enviados são substituídos; os já enviados ficam no
 * histórico.
 */
export async function agendarLembreteAutomatico(id_tarefa: number) {
  await query(`DELETE FROM lembrete WHERE id_tarefa = $1 AND enviado = FALSE`, [id_tarefa]);
  await query(
    `INSERT INTO lembrete (data_programada, enviado, id_tarefa)
     SELECT GREATEST(t.data_limite - $2::int, CURRENT_DATE), FALSE, t.id_tarefa
       FROM tarefa t
      WHERE t.id_tarefa = $1 AND t.data_limite >= CURRENT_DATE`,
    [id_tarefa, env.LEMBRETE_DIAS_ANTES]
  );
}

/**
 * Envia os lembretes agendados que já chegaram na data. Tarefas já
 * entregues/aprovadas são puladas (o lembrete continua pendente, sem e-mail).
 * Chamado pelo agendador em server.ts.
 */
export async function processarLembretesPendentes(): Promise<number> {
  const r = await query<{ id_lembrete: number; id_tarefa: number }>(
    `SELECT l.id_lembrete, l.id_tarefa
       FROM lembrete l
       JOIN tarefa t ON t.id_tarefa = l.id_tarefa
       JOIN status_tarefa s ON s.id_status = t.id_status
      WHERE l.enviado = FALSE
        AND l.data_programada <= CURRENT_DATE
        AND s.descricao <> ALL($1::text[])
      ORDER BY l.data_programada`,
    [STATUS_CONCLUIDOS]
  );

  let enviados = 0;
  for (const { id_lembrete, id_tarefa } of r.rows) {
    try {
      const { modo, destinatarios } = await enviarParaEquipe(id_tarefa);
      await query(
        `UPDATE lembrete SET enviado = TRUE, enviado_em = now(), destinatarios = $2, modo_envio = $3
          WHERE id_lembrete = $1`,
        [id_lembrete, destinatarios, modo]
      );
      enviados++;
    } catch (err) {
      // um e-mail com problema não pode travar os outros; tenta de novo na próxima rodada
      console.error(`Falha ao enviar o lembrete ${id_lembrete} (tarefa ${id_tarefa}):`, err);
    }
  }
  return enviados;
}

/** Roda o processamento agora e depois de hora em hora. */
export function iniciarAgendadorDeLembretes() {
  let rodando = false;
  const rodar = async () => {
    if (rodando) return;
    rodando = true;
    try {
      const n = await processarLembretesPendentes();
      if (n > 0) console.log(`Lembretes automáticos enviados: ${n}`);
    } catch (err) {
      console.error("Falha no agendador de lembretes:", err);
    } finally {
      rodando = false;
    }
  };
  setTimeout(rodar, 30_000); // dá tempo do pós-deploy (migrate + seed) terminar
  setInterval(rodar, 60 * 60 * 1000);
}
