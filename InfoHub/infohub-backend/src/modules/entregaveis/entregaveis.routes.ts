import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { query } from "../../config/db";
import { filtrarPorEquipesVisiveis } from "../../utils/acessoEquipe";

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
    // id_equipe vem da tarefa só para o filtro do mentor; não vai na resposta
    const r = id_tarefa
      ? await query<{ id_equipe: number }>(
          `SELECT e.*, t.id_equipe FROM entregavel e JOIN tarefa t ON t.id_tarefa = e.id_tarefa
           WHERE e.id_tarefa = $1 ORDER BY e.data_envio DESC`,
          [id_tarefa]
        )
      : await query<{ id_equipe: number }>(
          `SELECT e.*, t.id_equipe FROM entregavel e JOIN tarefa t ON t.id_tarefa = e.id_tarefa
           ORDER BY e.data_envio DESC`
        );
    const visiveis = await filtrarPorEquipesVisiveis(req.usuario!, r.rows);
    res.json(visiveis.map(({ id_equipe: _ignorado, ...entregavel }) => entregavel));
  }
);
