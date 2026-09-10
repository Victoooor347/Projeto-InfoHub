import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import * as controller from "./equipes.controller";
import {
  adicionarMentorSchema,
  atualizarLinkPitchSchema,
  avancarEtapaSchema,
  idEquipeMentorParamSchema,
  idParamSchema,
  listarEquipesQuerySchema,
  marcarProntoSchema,
} from "./equipes.schemas";

export const equipesRouter = Router();

// RF-06/RF-07: funil kanban com busca e filtros — visível a admin e mentor
// (mentor acompanha o sistema todo, não só as equipes dele — esclarecido com o cliente).
equipesRouter.get(
  "/",
  authenticate,
  requireRole("admin", "mentor"),
  validate({ query: listarEquipesQuerySchema }),
  controller.listar
);

equipesRouter.get(
  "/:id",
  authenticate,
  validate({ params: idParamSchema }),
  controller.buscarPorId
);

// RF-09: avançar/retroceder etapa manualmente
equipesRouter.patch(
  "/:id/etapa",
  authenticate,
  requireRole("admin", "mentor"),
  validate({ params: idParamSchema, body: avancarEtapaSchema }),
  controller.avancarEtapa
);

equipesRouter.patch(
  "/:id/pronto",
  authenticate,
  requireRole("admin", "mentor"),
  validate({ params: idParamSchema, body: marcarProntoSchema }),
  controller.marcarPronto
);

// Q3: pitch final é link do YouTube — o próprio líder da equipe também pode atualizar
equipesRouter.patch(
  "/:id/link-pitch",
  authenticate,
  validate({ params: idParamSchema, body: atualizarLinkPitchSchema }),
  controller.atualizarLinkPitch
);

equipesRouter.get(
  "/:id/mentores",
  authenticate,
  validate({ params: idParamSchema }),
  controller.listarMentores
);

// Uma equipe pode ter mais de um mentor; admin também pode virar mentor de uma equipe.
equipesRouter.post(
  "/:id/mentores",
  authenticate,
  requireRole("admin"),
  validate({ params: idParamSchema, body: adicionarMentorSchema }),
  controller.adicionarMentor
);

equipesRouter.delete(
  "/:id/mentores/:idUsuario",
  authenticate,
  requireRole("admin"),
  validate({ params: idEquipeMentorParamSchema }),
  controller.removerMentor
);
