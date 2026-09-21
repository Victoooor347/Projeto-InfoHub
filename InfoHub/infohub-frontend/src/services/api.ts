import { api, request } from "./http";
import type {
  Anotacao,
  AreaIdeia,
  ComoConheceu,
  Curso,
  Entregavel,
  Equipe,
  EquipeMentor,
  EquipeUsuario,
  EstagioIdeia,
  Etapa,
  Lembrete,
  StatusTarefa,
  Tarefa,
  Usuario,
} from "../types";

/** Uma linha de equipe_usuario já com os dados públicos do usuário aninhados. */
export interface Integrante {
  id_equipe_usuario: number;
  id_equipe: number;
  papel: "lider" | "integrante";
  usuario: Usuario;
}

export interface RespostaLogin {
  token: string;
  usuario: Usuario;
}

/** Colega que ganhou conta nova na inscrição — senha só aparece nesta resposta. */
export interface ColegaCriado {
  nome: string;
  email: string;
  senha_provisoria: string;
}

export interface RespostaInscricao {
  /** null quando quem cadastrou foi o admin (ele continua logado como admin). */
  token: string | null;
  usuario: Usuario;
  equipe: Equipe;
  colegas_criados: ColegaCriado[];
}

export interface ColegaInscricao {
  nome?: string;
  email: string;
  id_curso: number;
}

export interface DadosInscricao {
  nome_lider: string;
  telefone: string;
  email: string;
  senha: string;
  id_curso: number;
  semestre: number;
  colegas: ColegaInscricao[];
  nome_equipe: string;
  nome_ideia: string;
  descricao_ideia: string;
  area_ideia: AreaIdeia;
  estagio_ideia: EstagioIdeia;
  como_conheceu: ComoConheceu | null;
}

function qs(params: Record<string, string | number | undefined>) {
  const busca = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== "") busca.set(chave, String(valor));
  }
  const texto = busca.toString();
  return texto ? `?${texto}` : "";
}

// ---------------------------------------------------------------- autenticação

export const auth = {
  login: (email: string, senha: string) =>
    request<RespostaLogin>("/api/auth/login", {
      method: "POST",
      body: { email, senha },
      auth: false,
    }),
  /** Restaura a sessão a partir do token salvo (usado no F5). */
  me: () => api.get<Usuario>("/api/auth/me"),
  /** Encerra a sessão deste navegador (revoga o refresh token no servidor). */
  logout: () => request<void>("/api/auth/logout", { method: "POST", auth: false }),
  /** O próprio usuário troca a senha; devolve token novo (as outras sessões caem). */
  trocarSenha: (senha_atual: string, nova_senha: string) =>
    api.patch<RespostaLogin>("/api/auth/senha", { senha_atual, nova_senha }),
};

export const inscricao = {
  enviar: (dados: DadosInscricao) =>
    request<RespostaInscricao>("/api/inscricao", { method: "POST", body: dados, auth: false }),
};

// ------------------------------------------------------- dados de referência

export const cursos = {
  listar: () => api.get<Curso[]>("/api/cursos"),
};

/**
 * Lista TODAS as etapas de TODAS as equipes de uma vez (cada linha já vem
 * com id_equipe) — só admin/mentor. Serve pra montar seletores locais
 * (Kanban, dashboard, relatórios) sem uma chamada por equipe. Não existe
 * mais um catálogo global de 6 etapas — etapa pertence à equipe agora
 * (ver README do backend, decisão 7).
 */
export const etapas = {
  listarTodas: () => api.get<Etapa[]>("/api/etapas"),
};

export const statusTarefas = {
  listar: () => api.get<StatusTarefa[]>("/api/status-tarefas"),
};

// ------------------------------------------------------------------ usuários

export const usuarios = {
  listar: (perfil?: "aluno" | "mentor" | "admin") => api.get<Usuario[]>(`/api/usuarios${qs({ perfil })}`),
  buscarPorId: (id: number) => api.get<Usuario>(`/api/usuarios/${id}`),
  criar: (dados: { nome: string; email: string; telefone?: string | null; senha: string; perfil: "admin" | "mentor" }) =>
    api.post<Usuario>("/api/usuarios", dados),
  atualizar: (id: number, dados: { nome?: string; telefone?: string | null; ativo?: boolean }) =>
    api.patch<Usuario>(`/api/usuarios/${id}`, dados),
};

// ------------------------------------------------------------------- equipes

export const equipes = {
  listar: (filtro: { busca?: string; area?: string; mentor?: number } = {}) =>
    api.get<Equipe[]>(`/api/equipes${qs(filtro)}`),
  buscarPorId: (id: number) => api.get<Equipe>(`/api/equipes/${id}`),
  avancarEtapa: (id: number, delta: 1 | -1) => api.patch<Equipe>(`/api/equipes/${id}/etapa`, { delta }),
  marcarPronto: (id: number, pronto: boolean) => api.patch<Equipe>(`/api/equipes/${id}/pronto`, { pronto }),
  atualizarLinkPitch: (id: number, link_pitch: string) =>
    api.patch<Equipe>(`/api/equipes/${id}/link-pitch`, { link_pitch }),
  listarIntegrantes: (id: number) => api.get<Integrante[]>(`/api/equipes/${id}/integrantes`),
  listarMentores: (id: number) => api.get<Usuario[]>(`/api/equipes/${id}/mentores`),
  adicionarMentor: (id: number, id_usuario: number) =>
    api.post<Usuario[]>(`/api/equipes/${id}/mentores`, { id_usuario }),
  removerMentor: (id: number, id_usuario: number) =>
    api.delete<Usuario[]>(`/api/equipes/${id}/mentores/${id_usuario}`),
  /** Jornada da equipe (não é mais uma lista fixa de 6 — cada equipe tem a sua). */
  listarEtapas: (id: number) => api.get<Etapa[]>(`/api/equipes/${id}/etapas`),
  /** Decisão do InfoHub (WhatsApp): só o mentor DESTA equipe pode acrescentar etapa extra. */
  criarEtapa: (id: number, nome: string, descricao: string) =>
    api.post<Etapa>(`/api/equipes/${id}/etapas`, { nome, descricao }),
};

export const equipeUsuarios = {
  listar: (filtro: { id_equipe?: number; id_usuario?: number } = {}) =>
    api.get<EquipeUsuario[]>(`/api/equipe-usuarios${qs(filtro)}`),
};

export const equipeMentores = {
  listar: (filtro: { id_equipe?: number } = {}) =>
    api.get<EquipeMentor[]>(`/api/equipe-mentores${qs(filtro)}`),
};

// -------------------------------------------------------------------- tarefas

export const tarefas = {
  listar: (filtro: { id_equipe?: number; id_status?: number } = {}) =>
    api.get<Tarefa[]>(`/api/tarefas${qs(filtro)}`),
  buscarPorId: (id: number) => api.get<Tarefa>(`/api/tarefas/${id}`),
  criar: (dados: { titulo: string; descricao: string; data_limite: string; id_equipe: number; id_etapa: number }) =>
    api.post<Tarefa>("/api/tarefas", dados),
  atualizarStatus: (id: number, id_status: number) =>
    api.patch<Tarefa>(`/api/tarefas/${id}/status`, { id_status }),
  atualizarPrazo: (id: number, data_limite: string) =>
    api.patch<Tarefa>(`/api/tarefas/${id}/prazo`, { data_limite }),
  /** Entrega por link OU por arquivo (conteúdo em base64). */
  enviarEntregavel: (
    id: number,
    entrega:
      | { arquivo_url: string; tipo?: string }
      | { arquivo: { nome: string; tipo_mime: string; conteudo_base64: string } }
  ) => api.post<Entregavel>(`/api/tarefas/${id}/entregaveis`, entrega),
  listarEntregaveis: (id: number) => api.get<Entregavel[]>(`/api/tarefas/${id}/entregaveis`),
};

// --------------------------------------------- entregáveis / anotações / lembretes

export const entregaveis = {
  listar: (filtro: { id_tarefa?: number } = {}) => api.get<Entregavel[]>(`/api/entregaveis${qs(filtro)}`),
};

export const anotacoes = {
  listar: (filtro: { id_equipe?: number } = {}) => api.get<Anotacao[]>(`/api/anotacoes${qs(filtro)}`),
  criar: (dados: { descricao: string; id_equipe: number; id_etapa: number }) =>
    api.post<Anotacao>("/api/anotacoes", dados),
};

export const lembretes = {
  listar: (filtro: { id_tarefa?: number } = {}) => api.get<Lembrete[]>(`/api/lembretes${qs(filtro)}`),
  criar: (id_tarefa: number) => api.post<Lembrete>("/api/lembretes", { id_tarefa }),
};
