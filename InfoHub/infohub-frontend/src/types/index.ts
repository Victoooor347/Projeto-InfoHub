// Tipos derivados diretamente do schema em banco.sql

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
  telefone: string;
  email: string;
  senha: string;
  perfil: Perfil;
  id_curso: number | null;
  semestre: number | null;
}

export interface Etapa {
  id_etapa: number;
  nome: string;
  descricao: string;
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
  pronto_para_inovamf?: boolean;
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
 * Extensão do frontend (ainda não existe no banco.sql atual).
 * Esclarecido em conversa com o cliente: uma equipe pode ter mais de um
 * mentor/monitor ("pode ter mais de um"), enquanto o schema atual só modela
 * `equipe.id_mentor` como FK única. Até a tabela `equipe_mentor` ser criada
 * no banco real, mantemos essa relação N:N só no mock.
 */
export interface EquipeMentor {
  id_equipe: number;
  id_usuario: number;
}
