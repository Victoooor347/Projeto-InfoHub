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
  /**
   * Campos resolvidos por JOIN, presentes em toda resposta da API (list,
   * detail e mutações) — evitam N+1 chamadas do frontend pra saber "em
   * que posição da jornada essa equipe está" e "ela já chegou na última
   * etapa". `etapa_atual_padrao=false` quando a equipe está numa etapa
   * extra criada por um mentor (ordem > 6).
   */
  etapa_atual_ordem: number;
  etapa_atual_nome: string;
  etapa_atual_padrao: boolean;
  total_etapas: number;
}

/**
 * Etapa dentro da jornada de UMA equipe específica (não é mais um
 * catálogo global — ver schema.sql, decisão 7). `ordem` é a posição dela
 * na jornada dessa equipe; `padrao=true` para as 6 da cartilha,
 * `padrao=false` para as extras criadas por um mentor.
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
