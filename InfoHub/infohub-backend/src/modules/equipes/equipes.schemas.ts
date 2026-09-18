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

// Q3: o pitch é SEMPRE um link do YouTube. Validar o domínio também impede
// links "javascript:..." ou de sites aleatórios aparecendo na tela do admin.
const DOMINIOS_YOUTUBE = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"];

export const atualizarLinkPitchSchema = z.object({
  link_pitch: z
    .string()
    .trim()
    .max(255)
    .refine(
      (valor) => {
        try {
          const url = new URL(valor);
          return (url.protocol === "https:" || url.protocol === "http:") && DOMINIOS_YOUTUBE.includes(url.hostname);
        } catch {
          return false;
        }
      },
      { error: "Informe um link do YouTube (ex.: https://youtu.be/...)" }
    ),
});

export const adicionarMentorSchema = z.object({
  id_usuario: z.coerce.number().int().positive(),
});

export const marcarProntoSchema = z.object({
  pronto: z.boolean(),
});

export const criarEtapaSchema = z.object({
  nome: z.string().min(2, { error: "Nome muito curto" }).max(100),
  descricao: z.string().min(1, { error: "Descreva a etapa" }),
});

export { areaIdeiaEnum, estagioIdeiaEnum, comoConheceuEnum };
