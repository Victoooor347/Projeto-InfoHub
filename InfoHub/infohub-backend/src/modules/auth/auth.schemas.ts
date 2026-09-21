import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "E-mail inválido" }),
  senha: z.string().min(1, { error: "Informe a senha" }),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const trocarSenhaSchema = z
  .object({
    senha_atual: z.string().min(1, { error: "Informe a senha atual" }),
    nova_senha: z
      .string()
      .min(6, { error: "A nova senha precisa ter pelo menos 6 caracteres" })
      .max(72, { error: "A nova senha pode ter no máximo 72 caracteres" }), // limite do bcrypt
  })
  .refine((d) => d.senha_atual !== d.nova_senha, {
    error: "A nova senha precisa ser diferente da atual",
    path: ["nova_senha"],
  });
export type TrocarSenhaInput = z.infer<typeof trocarSenhaSchema>;
