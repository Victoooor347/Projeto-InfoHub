import { z } from "zod";
import { Router } from "express";
import type { Request, Response } from "express";
import { authenticate } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { filtrarPorEquipesVisiveis, garantirAcessoEquipe } from "../../utils/acessoEquipe";
import * as service from "./equipeUsuarios.service";

const querySchema = z.object({
  id_equipe: z.coerce.number().int().positive().optional(),
  id_usuario: z.coerce.number().int().positive().optional(),
});

export const equipeUsuariosRouter = Router();

equipeUsuariosRouter.get(
  "/",
  authenticate,
  validate({ query: querySchema }),
  async (req: Request, res: Response) => {
    const { id_equipe, id_usuario } = req.query as unknown as { id_equipe?: number; id_usuario?: number };

    // Aluno pode ver a lista completa de uma equipe da qual participa (pra
    // mostrar quem são os colegas), mas não a de equipes de terceiros nem
    // consultar a participação de outro usuário isoladamente.
    if (req.usuario!.perfil === "aluno") {
      if (id_equipe) {
        const pertence = await service.usuarioPertenceEquipe(req.usuario!.id_usuario, id_equipe);
        if (!pertence) return res.json([]);
        return res.json(await service.listarEquipeUsuarios({ id_equipe }));
      }
      const rows = await service.listarEquipeUsuarios({ id_usuario: req.usuario!.id_usuario });
      return res.json(rows);
    }

    // admin: tudo. mentor: só os vínculos das equipes que ele mentora.
    if (id_equipe) await garantirAcessoEquipe(req.usuario!, id_equipe);
    const rows = await service.listarEquipeUsuarios({ id_equipe, id_usuario });
    res.json(await filtrarPorEquipesVisiveis(req.usuario!, rows));
  }
);
