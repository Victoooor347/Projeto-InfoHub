import type {
  Curso,
  Equipe,
  EquipeMentor,
  EquipeUsuario,
  Etapa,
  StatusTarefa,
  StatusTarefaDescricao,
  Tarefa,
  Usuario,
} from "../types";

export function getCursoNome(cursos: Curso[], idCurso: number | null): string {
  if (idCurso == null) return "—";
  return cursos.find((c) => c.id_curso === idCurso)?.nome ?? "—";
}

export function getEtapa(etapas: Etapa[], idEtapa: number): Etapa | undefined {
  return etapas.find((e) => e.id_etapa === idEtapa);
}

export function getEquipeMembros(
  equipeUsuarios: EquipeUsuario[],
  usuarios: Usuario[],
  idEquipe: number
): { usuario: Usuario; papel: "lider" | "integrante" }[] {
  return equipeUsuarios
    .filter((eu) => eu.id_equipe === idEquipe)
    .map((eu) => {
      const usuario = usuarios.find((u) => u.id_usuario === eu.id_usuario)!;
      return { usuario, papel: eu.papel };
    })
    .filter((m) => Boolean(m.usuario))
    .sort((a, b) => (a.papel === b.papel ? 0 : a.papel === "lider" ? -1 : 1));
}

export function getLiderEquipe(
  equipeUsuarios: EquipeUsuario[],
  usuarios: Usuario[],
  idEquipe: number
): Usuario | undefined {
  const vinc = equipeUsuarios.find((eu) => eu.id_equipe === idEquipe && eu.papel === "lider");
  if (!vinc) return undefined;
  return usuarios.find((u) => u.id_usuario === vinc.id_usuario);
}

export function getMentor(usuarios: Usuario[], idMentor: number | null): Usuario | undefined {
  if (idMentor == null) return undefined;
  return usuarios.find((u) => u.id_usuario === idMentor);
}

export function getMentoresDaEquipe(
  equipeMentores: EquipeMentor[],
  usuarios: Usuario[],
  idEquipe: number
): Usuario[] {
  return equipeMentores
    .filter((em) => em.id_equipe === idEquipe)
    .map((em) => usuarios.find((u) => u.id_usuario === em.id_usuario))
    .filter((u): u is Usuario => Boolean(u));
}

export function getPapelDoUsuarioNaEquipe(
  equipeUsuarios: EquipeUsuario[],
  idUsuario: number,
  idEquipe: number
): "lider" | "integrante" | undefined {
  return equipeUsuarios.find((eu) => eu.id_usuario === idUsuario && eu.id_equipe === idEquipe)?.papel;
}

export function getEquipesDoUsuario(equipeUsuarios: EquipeUsuario[], idUsuario: number): number[] {
  return equipeUsuarios.filter((eu) => eu.id_usuario === idUsuario).map((eu) => eu.id_equipe);
}

export function getTarefasDaEquipe(tarefas: Tarefa[], idEquipe: number): Tarefa[] {
  return tarefas.filter((t) => t.id_equipe === idEquipe);
}

export function getStatusDescricao(statusTarefa: StatusTarefa[], idStatus: number): StatusTarefaDescricao {
  return statusTarefa.find((s) => s.id_status === idStatus)?.descricao ?? "Pendente";
}

export function isPrazoVencido(dataLimite: string): boolean {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const limite = new Date(dataLimite + "T00:00:00");
  return limite < hoje;
}

export function diasParaPrazo(dataLimite: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const limite = new Date(dataLimite + "T00:00:00");
  return Math.round((limite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatarData(iso: string): string {
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const statusEstilo: Record<StatusTarefaDescricao, { bg: string; text: string; dot: string }> = {
  Pendente: { bg: "bg-brand-info-soft", text: "text-brand-info", dot: "bg-brand-info" },
  "Em andamento": { bg: "bg-brand-warning-soft", text: "text-brand-warning", dot: "bg-brand-warning" },
  Entregue: { bg: "bg-paper-alt", text: "text-ink-soft", dot: "bg-ink-soft" },
  Atrasada: { bg: "bg-brand-danger-soft", text: "text-brand-danger", dot: "bg-brand-danger" },
  Aprovada: { bg: "bg-brand-success-soft", text: "text-brand-success", dot: "bg-brand-success" },
  "Reprovada/Ajustar": { bg: "bg-brand-danger-soft", text: "text-brand-danger", dot: "bg-brand-danger" },
};

/**
 * O backend já garante essa invariante no servidor (PATCH /equipes/:id/pronto
 * só aceita `true` quando a equipe está na última etapa da jornada dela —
 * ver equipes.service.ts, marcarProntoParaInovAMF). Não precisa checar
 * "etapa === 6" aqui: isso deixou de fazer sentido desde que a jornada
 * passou a ter tamanho variável por equipe.
 */
export function equipeProntaParaInovAMF(equipe: Equipe): boolean {
  return Boolean(equipe.pronto_para_inovamf);
}
