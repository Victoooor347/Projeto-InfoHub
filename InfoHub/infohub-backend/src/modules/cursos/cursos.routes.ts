import { Router } from "express";
import type { Request, Response } from "express";
import { query } from "../../config/db";

export const cursosRouter = Router();

cursosRouter.get("/", async (_req: Request, res: Response) => {
  const r = await query(`SELECT id_curso, nome FROM cursos ORDER BY nome`);
  res.json(r.rows);
});
