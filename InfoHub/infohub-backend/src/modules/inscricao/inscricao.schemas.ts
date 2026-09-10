import { z } from "zod";
import { areaIdeiaEnum, comoConheceuEnum, estagioIdeiaEnum } from "../equipes/equipes.schemas";

// Esclarecido com o cliente: não precisa de RA, só e-mail e curso do colega.
const colegaSchema = z.object({
  nome: z.string().max(100).optional(),
  email: z.email({ error: "E-mail do colega inválido" }),
  id_curso: z.coerce.number().int().positive(),
});

export const inscricaoSchema = z.object({
  nome_lider: z.string().min(2, { error: "Nome muito curto" }).max(100),
  telefone: z.string().min(1, { error: "Informe um telefone" }).max(20),
  email: z.email({ error: "E-mail inválido" }).max(100),
  senha: z.string().min(6, { error: "Senha precisa ter pelo menos 6 caracteres" }),
  id_curso: z.coerce.number().int().positive(),
  semestre: z.coerce.number().int().min(1).max(12),
  colegas: z.array(colegaSchema).default([]),

  nome_equipe: z.string().min(2, { error: "Nome da equipe muito curto" }).max(100),
  nome_ideia: z.string().min(2, { error: "Nome da ideia muito curto" }).max(100),
  descricao_ideia: z.string().min(1, { error: "Descreva a ideia" }),
  area_ideia: areaIdeiaEnum,
  estagio_ideia: estagioIdeiaEnum,
  como_conheceu: comoConheceuEnum.optional().nullable(),
});
export type InscricaoInput = z.infer<typeof inscricaoSchema>;
