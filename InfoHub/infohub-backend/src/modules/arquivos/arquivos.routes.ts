import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { authenticate } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { query } from "../../config/db";
import { AppError } from "../../utils/AppError";
import { garantirAcessoEquipe } from "../../utils/acessoEquipe";

export const arquivosRouter = Router();

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

/**
 * Download de um arquivo enviado como entregável. Mesma regra de acesso das
 * equipes: admin baixa qualquer um; mentor só das equipes que mentora; aluno
 * só da própria equipe. O frontend baixa via fetch (com o token), por isso
 * um <a href> direto para esta rota não funciona.
 */
arquivosRouter.get("/:id", authenticate, validate({ params: idParamSchema }), async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };

  // 1º só os metadados — não carrega o conteúdo de quem não tem permissão
  const meta = await query<{ id_equipe: number; nome_original: string; tipo_mime: string }>(
    `SELECT id_equipe, nome_original, tipo_mime FROM arquivo WHERE id_arquivo = $1`,
    [id]
  );
  if (!meta.rows[0]) throw AppError.notFound("Arquivo não encontrado");
  await garantirAcessoEquipe(req.usuario!, meta.rows[0].id_equipe);

  const r = await query<{ conteudo: Buffer }>(`SELECT conteudo FROM arquivo WHERE id_arquivo = $1`, [id]);
  const { nome_original, tipo_mime } = meta.rows[0];

  res.setHeader("Content-Type", tipo_mime);
  res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(nome_original)}`);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.send(r.rows[0].conteudo);
});
