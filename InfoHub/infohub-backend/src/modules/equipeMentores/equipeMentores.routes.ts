import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { authenticate } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { query } from "../../config/db";

export const equipeMentoresRouter = Router();

const querySchema = z.object({
  id_equipe: z.coerce.number().int().positive().optional(),
});

/**
 * Lista os pares (id_equipe, id_usuario) da tabela equipe_mentor.
 *
 * Existe para o frontend montar o mapa de mentores de todas as equipes em uma
 * única requisição, em vez de chamar GET /equipes/:id/mentores para cada uma.
 * Um aluno só recebe os vínculos das equipes das quais ele participa.
 */
equipeMentoresRouter.get(
  "/",
  authenticate,
  validate({ query: querySchema }),
  async (req: Request, res: Response) => {
    const { id_equipe } = req.query as unknown as { id_equipe?: number };
    const usuario = req.usuario!;

    const condicoes: string[] = [];
    const params: unknown[] = [];

    if (id_equipe) {
      params.push(id_equipe);
      condicoes.push(`em.id_equipe = $${params.length}`);
    }

    if (usuario.perfil === "aluno") {
      params.push(usuario.id_usuario);
      condicoes.push(
        `em.id_equipe IN (SELECT id_equipe FROM equipe_usuario WHERE id_usuario = $${params.length})`
      );
    }

    const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";
    const r = await query<{ id_equipe: number; id_usuario: number }>(
      `SELECT em.id_equipe, em.id_usuario FROM equipe_mentor em ${where} ORDER BY em.id_equipe`,
      params
    );
    res.json(r.rows);
  }
);
