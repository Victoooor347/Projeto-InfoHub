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

// Entrega por LINK (ex.: YouTube, Drive) ou por ARQUIVO (upload), nunca os dois.
// O arquivo vem em base64 dentro do JSON — dispensa biblioteca de upload
// (multipart) e cabe no limite de 10 MB do express.json() em app.ts.
export const enviarEntregavelSchema = z
  .object({
    arquivo_url: z
      .url({ protocol: /^https?$/, error: "Informe um link válido (https://...)" })
      .max(255)
      .optional(),
    tipo: z.string().max(50).optional(),
    arquivo: z
      .object({
        nome: z.string().min(1).max(255),
        tipo_mime: z.string().max(100).default("application/octet-stream"),
        conteudo_base64: z.string().min(1, { error: "Arquivo vazio" }),
      })
      .optional(),
  })
  .refine((d) => Boolean(d.arquivo_url) !== Boolean(d.arquivo), {
    error: "Envie um link OU um arquivo",
  });
export type EnviarEntregavelInput = z.infer<typeof enviarEntregavelSchema>;
