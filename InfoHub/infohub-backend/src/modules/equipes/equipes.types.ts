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
}
