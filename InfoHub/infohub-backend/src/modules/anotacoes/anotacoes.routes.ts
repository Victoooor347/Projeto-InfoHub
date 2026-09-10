import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { query } from "../../config/db";

export const anotacoesRouter = Router();

const querySchema = z.object({
  id_equipe: z.coerce.number().int().positive().optional(),
});

const criarSchema = z.object({
  descricao: z.string().min(1, { error: "Escreva a anotação" }),
  id_equipe: z.coerce.number().int().positive(),
  id_etapa: z.coerce.number().int().positive(),
});

// RF-10/RF-08: anotações internas — nunca acessíveis ao perfil "aluno".
anotacoesRouter.get(
  "/",
  authenticate,
  requireRole("admin", "mentor"),
  validate({ query: querySchema }),
  async (req: Request, res: Response) => {
    const { id_equipe } = req.query as unknown as { id_equipe?: number };
    if (id_equipe) {
      const r = await query(
        `SELECT * FROM anotacoes WHERE id_equipe = $1 ORDER BY data_registro DESC`,
        [id_equipe]
      );
      return res.json(r.rows);
    }
    const r = await query(`SELECT * FROM anotacoes ORDER BY data_registro DESC`);
    res.json(r.rows);
  }
);

anotacoesRouter.post(
  "/",
  authenticate,
  requireRole("admin", "mentor"),
  validate({ body: criarSchema }),
  async (req: Request, res: Response) => {
    const { descricao, id_equipe, id_etapa } = req.body as {
      descricao: string;
      id_equipe: number;
      id_etapa: number;
    };
    const r = await query(
      `INSERT INTO anotacoes (descricao, id_usuario, id_equipe, id_etapa) VALUES ($1,$2,$3,$4) RETURNING *`,
      [descricao, req.usuario!.id_usuario, id_equipe, id_etapa]
    );
    res.status(201).json(r.rows[0]);
  }
);
