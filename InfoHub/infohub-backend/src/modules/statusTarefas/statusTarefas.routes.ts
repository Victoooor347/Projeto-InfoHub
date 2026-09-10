import { Router } from "express";
import type { Request, Response } from "express";
import { query } from "../../config/db";

export const statusTarefasRouter = Router();

statusTarefasRouter.get("/", async (_req: Request, res: Response) => {
  const r = await query(`SELECT id_status, descricao FROM status_tarefa ORDER BY id_status`);
  res.json(r.rows);
});
