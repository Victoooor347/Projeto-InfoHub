import { Router } from "express";
import type { Request, Response } from "express";
import { authenticate, requireRole } from "../../middlewares/auth";
import { query } from "../../config/db";

export const etapasRouter = Router();

/**
 * Lista TODAS as etapas de TODAS as equipes de uma vez — cada linha já
 * vem com `id_equipe`, então não é ambíguo como a antiga /etapas global
 * (que era um catálogo fixo de 6). Existe pra admin/mentor montarem
 * seletores locais (Kanban, dashboard, relatórios) sem fazer uma chamada
 * por equipe. Mesmo padrão já usado em /equipe-usuarios e
 * /equipe-mentores. Aluno usa GET /equipes/:id/etapas (só a própria).
 */
etapasRouter.get("/", authenticate, requireRole("admin", "mentor"), async (_req: Request, res: Response) => {
  const r = await query(`SELECT * FROM etapa ORDER BY id_equipe, ordem`);
  res.json(r.rows);
});
