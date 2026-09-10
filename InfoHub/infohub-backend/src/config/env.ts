import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url({ error: "DATABASE_URL precisa ser uma URL de conexão Postgres válida" }),
  PORT: z.coerce.number().int().positive().default(3333),
  JWT_SECRET: z.string().min(10, { error: "JWT_SECRET precisa ter pelo menos 10 caracteres" }),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Variáveis de ambiente inválidas:");
  console.error(z.treeifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
