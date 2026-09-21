import "dotenv/config";
import { z } from "zod";

// variável opcional: string vazia no Coolify conta como "não definida"
const opcional = z
  .string()
  .optional()
  .transform((valor) => (valor && valor.trim() ? valor.trim() : undefined));

const envSchema = z.object({
  DATABASE_URL: z.url({ error: "DATABASE_URL precisa ser uma URL de conexão Postgres válida" }),
  PORT: z.coerce.number().int().positive().default(3333),
  JWT_SECRET: z.string().min(10, { error: "JWT_SECRET precisa ter pelo menos 10 caracteres" }),
  /** Duração do token de ACESSO (curto). A sessão é renovada pelo refresh token. */
  JWT_EXPIRES_IN: z.string().default("15m"),
  /** Duração da sessão (refresh token, em cookie httpOnly). */
  REFRESH_TOKEN_DIAS: z.coerce.number().int().min(1).max(90).default(7),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // ---------- e-mail (lembretes) — tudo opcional ----------
  // Sem SMTP_HOST/SMTP_USER/SMTP_PASS o sistema funciona em "modo simulação":
  // os lembretes são registrados e o e-mail é só impresso no log.
  SMTP_HOST: opcional,
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: opcional,
  SMTP_PASS: opcional,
  /** Remetente, ex.: "InfoHub <seuemail@gmail.com>". Padrão: SMTP_USER. */
  EMAIL_FROM: opcional,
  /**
   * Se definido, TODO e-mail vai para este endereço (os destinatários reais
   * aparecem no assunto). Ideal para demo: as contas do seed são fictícias.
   */
  EMAIL_TESTE_PARA: opcional,
  /** Endereço público do sistema, usado no link dos e-mails. */
  APP_URL: opcional,
  /** Quantos dias antes do prazo o lembrete automático é enviado. */
  LEMBRETE_DIAS_ANTES: z.coerce.number().int().min(0).max(30).default(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Variáveis de ambiente inválidas:");
  console.error(z.treeifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
