// Tipos espelhando exatamente o que a API devolve (ver infohub-backend/src/db/schema.sql).
// Nenhum deles inclui senha: o backend nunca expõe senha_hash.

export type NomeCurso =
  | "Sistemas de Informação"
  | "Direito"
  | "Administração"
  | "Gastronomia"
  | "Ciências Contábeis"
  | "Ontopsicologia"
  | "Hotelaria"
  | "Pedagogia";

export interface Curso {
  id_curso: number;
  nome: NomeCurso;
}

export type Perfil = "aluno" | "mentor" | "admin";

export interface Usuario {
  id_usuario: number;
  nome: string;
  telefone: string | null;
  email: string;
  perfil: Perfil;
  id_curso: number | null;
  semestre: number | null;
  ativo: boolean;
  criado_em: string;
}

/**
 * Etapa dentro da jornada de UMA equipe específica — não é mais um
 * catálogo global fixo de 6 (ver infohub-backend/src/db/schema.sql,
 * decisão 7). `ordem` posiciona a etapa na jornada dessa equipe;
 * `padrao=true` para as 6 da cartilha, `padrao=false` para uma etapa
 * extra que o mentor da equipe tiver criado.
 */
export interface Etapa {
  id_etapa: number;
  id_equipe: number;
  ordem: number;
  nome: string;
  descricao: string;
  padrao: boolean;
  criada_por: number | null;
  criado_em: string;
}

export type AreaIdeia =
  | "Saúde"
  | "Educação"
  | "Meio Ambiente"
  | "Tecnologia"
  | "Entretenimento"
  | "Serviços"
  | "Outro";

export type EstagioIdeia = "Apenas ideia" | "Validação" | "Prototipagem" | "Lançamento";

export type ComoConheceu = "Redes sociais" | "Amigos" | "Eventos" | "Outros";

export interface Equipe {
  id_equipe: number;
  nome_equipe: string;
  nome_ideia: string;
  descricao_ideia: string;
  area_ideia: AreaIdeia;
  estagio_ideia: EstagioIdeia;
  como_conheceu: ComoConheceu | null;
  link_pitch: string | null;
  id_mentor: number | null;
  id_etapa_atual: number;
  pronto_para_inovamf: boolean;
  criado_em: string;
  /** Resolvidos pela API via JOIN — evitam uma chamada extra por equipe. */
  etapa_atual_ordem: number;
  etapa_atual_nome: string;
  etapa_atual_padrao: boolean;
  total_etapas: number;
}

export type Papel = "lider" | "integrante";

export interface EquipeUsuario {
  id_equipe_usuario: number;
  id_equipe: number;
  id_usuario: number;
  papel: Papel;
}

export type StatusTarefaDescricao =
  | "Pendente"
  | "Em andamento"
  | "Entregue"
  | "Atrasada"
  | "Aprovada"
  | "Reprovada/Ajustar";

export interface StatusTarefa {
  id_status: number;
  descricao: StatusTarefaDescricao;
}

export interface Tarefa {
  id_tarefa: number;
  titulo: string;
  descricao: string;
  data_limite: string; // ISO date
  id_equipe: number;
  id_etapa: number;
  id_status: number;
}

export interface Entregavel {
  id_entregavel: number;
  arquivo_url: string;
  tipo: string | null;
  data_envio: string; // ISO datetime
  id_tarefa: number;
  id_usuario: number;
}

export interface Anotacao {
  id_anotacao: number;
  descricao: string;
  data_registro: string; // ISO datetime
  id_usuario: number;
  id_equipe: number;
  id_etapa: number;
}

export interface Lembrete {
  id_lembrete: number;
  data_programada: string; // ISO date
  enviado: boolean;
  id_tarefa: number;
}

/**
 * Relação N:N entre equipe e mentores (tabela `equipe_mentor` no banco).
 * Uma equipe pode ter mais de um mentor/monitor — `equipe.id_mentor` continua
 * existindo apontando para o "mentor principal", por compatibilidade com o
 * schema original do cliente.
 */
export interface EquipeMentor {
  id_equipe: number;
  id_usuario: number;
}
