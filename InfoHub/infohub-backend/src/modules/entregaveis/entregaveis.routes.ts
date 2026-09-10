import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { query } from "../../config/db";

export const entregaveisRouter = Router();

const querySchema = z.object({
  id_tarefa: z.coerce.number().int().positive().optional(),
});

// Listagem completa (sem filtro por equipe) é só pra admin/mentor montarem
// relatórios; a listagem por tarefa específica já existe em /tarefas/:id/entregaveis
// (essa sim acessível ao aluno dono da tarefa).
entregaveisRouter.get(
  "/",
  authenticate,
  requireRole("admin", "mentor"),
  validate({ query: querySchema }),
  async (req: Request, res: Response) => {
    const { id_tarefa } = req.query as unknown as { id_tarefa?: number };
    if (id_tarefa) {
      const r = await query(`SELECT * FROM entregavel WHERE id_tarefa = $1 ORDER BY data_envio DESC`, [
        id_tarefa,
      ]);
      return res.json(r.rows);
    }
    const r = await query(`SELECT * FROM entregavel ORDER BY data_envio DESC`);
    res.json(r.rows);
  }
);
