import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "E-mail inválido" }),
  senha: z.string().min(1, { error: "Informe a senha" }),
});
export type LoginInput = z.infer<typeof loginSchema>;
