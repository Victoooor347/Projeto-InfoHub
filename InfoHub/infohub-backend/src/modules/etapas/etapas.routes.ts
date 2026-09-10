import { Router } from "express";
import type { Request, Response } from "express";
import { query } from "../../config/db";

export const etapasRouter = Router();

etapasRouter.get("/", async (_req: Request, res: Response) => {
  const r = await query(`SELECT id_etapa, nome, descricao FROM etapa ORDER BY id_etapa`);
  res.json(r.rows);
});
