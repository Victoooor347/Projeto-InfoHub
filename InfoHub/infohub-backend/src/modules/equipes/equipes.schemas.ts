import { z } from "zod";

const areaIdeiaEnum = z.enum([
  "Saúde",
  "Educação",
  "Meio Ambiente",
  "Tecnologia",
  "Entretenimento",
  "Serviços",
  "Outro",
]);
const estagioIdeiaEnum = z.enum(["Apenas ideia", "Validação", "Prototipagem", "Lançamento"]);
const comoConheceuEnum = z.enum(["Redes sociais", "Amigos", "Eventos", "Outros"]);

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export const idEquipeMentorParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  idUsuario: z.coerce.number().int().positive(),
});

export const listarEquipesQuerySchema = z.object({
  busca: z.string().trim().min(1).optional(),
  area: areaIdeiaEnum.optional(),
  mentor: z.coerce.number().int().positive().optional(),
});

export const avancarEtapaSchema = z.object({
  delta: z.union([z.literal(1), z.literal(-1)], { error: "delta precisa ser 1 ou -1" }),
});

export const atualizarLinkPitchSchema = z.object({
  link_pitch: z.url({ error: "Informe uma URL válida (ex.: link do YouTube)" }),
});

export const adicionarMentorSchema = z.object({
  id_usuario: z.coerce.number().int().positive(),
});

export const marcarProntoSchema = z.object({
  pronto: z.boolean(),
});

export { areaIdeiaEnum, estagioIdeiaEnum, comoConheceuEnum };
