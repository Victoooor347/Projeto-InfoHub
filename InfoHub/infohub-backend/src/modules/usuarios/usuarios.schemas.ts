import { z } from "zod";

export const criarUsuarioSchema = z.object({
  nome: z.string().min(2, { error: "Nome muito curto" }).max(100),
  email: z.email({ error: "E-mail inválido" }).max(100),
  telefone: z.string().max(20).optional().nullable(),
  senha: z.string().min(6, { error: "Senha precisa ter pelo menos 6 caracteres" }),
  perfil: z.enum(["admin", "mentor"], { error: "Perfil precisa ser 'admin' ou 'mentor'" }),
});
export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;

export const atualizarUsuarioSchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  telefone: z.string().max(20).optional().nullable(),
  ativo: z.boolean().optional(),
});
export type AtualizarUsuarioInput = z.infer<typeof atualizarUsuarioSchema>;

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listarUsuariosQuerySchema = z.object({
  perfil: z.enum(["aluno", "mentor", "admin"]).optional(),
});
