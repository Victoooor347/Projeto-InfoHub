import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { query } from "../../config/db";

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
      const r = await query(`SELECT * FROM lembrete WHERE id_tarefa = $1 ORDER BY data_programada`, [
        id_tarefa,
      ]);
      return res.json(r.rows);
    }
    const r = await query(`SELECT * FROM lembrete ORDER BY data_programada`);
    res.json(r.rows);
  }
);

// RF-20: administrador/mentor dispara um lembrete manual avulso para uma
// equipe/tarefa específica. Nesta v1 (só API) isso apenas registra o
// lembrete como "enviado"; o disparo real de e-mail fica para quando o
// serviço de e-mail (Resend + Gmail, ver Q7) for integrado.
lembretesRouter.post(
  "/",
  authenticate,
  requireRole("admin", "mentor"),
  validate({ body: criarSchema }),
  async (req: Request, res: Response) => {
    const { id_tarefa } = req.body as { id_tarefa: number };
    const r = await query(
      `INSERT INTO lembrete (data_programada, enviado, id_tarefa) VALUES (CURRENT_DATE, TRUE, $1) RETURNING *`,
      [id_tarefa]
    );
    res.status(201).json(r.rows[0]);
  }
);
