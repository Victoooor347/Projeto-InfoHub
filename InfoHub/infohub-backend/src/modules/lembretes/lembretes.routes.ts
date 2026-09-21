import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { query } from "../../config/db";
import { dispararLembreteManual } from "./lembretes.service";
import { AppError } from "../../utils/AppError";
import { filtrarPorEquipesVisiveis, garantirAcessoEquipe } from "../../utils/acessoEquipe";

/** Equipe dona da tarefa — lembrete não tem id_equipe próprio. */
async function equipeDaTarefa(id_tarefa: number): Promise<number> {
  const r = await query<{ id_equipe: number }>(`SELECT id_equipe FROM tarefa WHERE id_tarefa = $1`, [id_tarefa]);
  if (!r.rows[0]) throw AppError.notFound("Tarefa não encontrada");
  return r.rows[0].id_equipe;
}

export const lembretesRouter = Router();

const querySchema = z.object({
  id_tarefa: z.coerce.number().int().positive().optional(),
});

const criarSchema = z.object({
  id_tarefa: z.coerce.number().int().positive(),
});

lembretesRouter.get(
  "/",
  authenticate,
  requireRole("admin", "mentor"),
  validate({ query: querySchema }),
  async (req: Request, res: Response) => {
    const { id_tarefa } = req.query as unknown as { id_tarefa?: number };
    if (id_tarefa) {
      await garantirAcessoEquipe(req.usuario!, await equipeDaTarefa(id_tarefa));
      const r = await query(`SELECT * FROM lembrete WHERE id_tarefa = $1 ORDER BY data_programada`, [
        id_tarefa,
      ]);
      return res.json(r.rows);
    }
    // id_equipe vem da tarefa só para o filtro do mentor; não vai na resposta
    const r = await query<{ id_equipe: number }>(
      `SELECT l.*, t.id_equipe FROM lembrete l JOIN tarefa t ON t.id_tarefa = l.id_tarefa ORDER BY l.data_programada`
    );
    const visiveis = await filtrarPorEquipesVisiveis(req.usuario!, r.rows);
    res.json(visiveis.map(({ id_equipe: _ignorado, ...lembrete }) => lembrete));
  }
);

// RF-20: administrador/mentor dispara um lembrete manual para a equipe de
// uma tarefa: o e-mail sai na hora (ver lembretes.service.ts e services/email.ts).
lembretesRouter.post(
  "/",
  authenticate,
  requireRole("admin", "mentor"),
  validate({ body: criarSchema }),
  async (req: Request, res: Response) => {
    const { id_tarefa } = req.body as { id_tarefa: number };
    await garantirAcessoEquipe(req.usuario!, await equipeDaTarefa(id_tarefa));
    // envia o e-mail para a equipe agora e registra o lembrete como enviado
    res.status(201).json(await dispararLembreteManual(id_tarefa));
  }
);
