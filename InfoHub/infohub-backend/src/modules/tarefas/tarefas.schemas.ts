import { z } from "zod";

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export const listarTarefasQuerySchema = z.object({
  id_equipe: z.coerce.number().int().positive().optional(),
  id_status: z.coerce.number().int().positive().optional(),
});

export const criarTarefaSchema = z.object({
  titulo: z.string().min(2, { error: "Título muito curto" }).max(100),
  descricao: z.string().min(1, { error: "Descreva a tarefa" }),
  data_limite: z.iso.date({ error: "data_limite precisa estar no formato AAAA-MM-DD" }),
  id_equipe: z.coerce.number().int().positive(),
  id_etapa: z.coerce.number().int().positive(),
});
export type CriarTarefaInput = z.infer<typeof criarTarefaSchema>;

export const atualizarStatusSchema = z.object({
  id_status: z.coerce.number().int().positive(),
});

export const atualizarPrazoSchema = z.object({
  data_limite: z.iso.date({ error: "data_limite precisa estar no formato AAAA-MM-DD" }),
});

export const enviarEntregavelSchema = z.object({
  arquivo_url: z.string().min(1, { error: "Informe o link ou nome do arquivo" }).max(255),
  tipo: z.string().max(50).optional(),
});
