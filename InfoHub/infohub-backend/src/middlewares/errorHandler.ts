import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: "Dados inválidos",
      detalhes: z_flatten(err),
    });
  }

  // corpo acima do limite do express.json() (ex.: arquivo grande demais)
  if ((err as { type?: string })?.type === "entity.too.large") {
    return res.status(413).json({ error: "O arquivo passa do limite de 5 MB" });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // erros do driver do Postgres costumam ter um "code" (ex.: 23505 = unique_violation)
  const pgErr = err as { code?: string; detail?: string; constraint?: string };
  if (pgErr?.code === "23505") {
    return res.status(409).json({ error: "Já existe um registro com esses dados (violação de unicidade)." });
  }
  if (pgErr?.code === "23503") {
    return res.status(409).json({ error: "Operação viola uma referência entre tabelas (chave estrangeira)." });
  }
  if (pgErr?.code === "23514") {
    return res.status(422).json({ error: "Valor fora do intervalo permitido." });
  }

  console.error("Erro não tratado:", err);
  return res.status(500).json({ error: "Erro interno do servidor" });
}

// Achata o erro do Zod num formato { campo: mensagem } simples para o frontend consumir.
function z_flatten(err: ZodError) {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const path = issue.path.join(".") || "_";
    if (!out[path]) out[path] = issue.message;
  }
  return out;
}
