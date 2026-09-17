import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import * as controller from "./equipes.controller";
import {
  adicionarMentorSchema,
  atualizarLinkPitchSchema,
  avancarEtapaSchema,
  criarEtapaSchema,
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

// Integrantes com nome/e-mail — é por aqui que o aluno descobre quem são os
// colegas e quem é o líder, já que GET /usuarios é restrito a admin/mentor.
equipesRouter.get(
  "/:id/integrantes",
  authenticate,
  validate({ params: idParamSchema }),
  controller.listarIntegrantes
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

// Jornada da equipe (não é mais uma lista fixa de 6 — cada equipe tem a sua).
equipesRouter.get(
  "/:id/etapas",
  authenticate,
  validate({ params: idParamSchema }),
  controller.listarEtapas
);

// Decisão do InfoHub via WhatsApp: só o mentor DESTA equipe pode
// acrescentar etapas extras na jornada dela (checagem fina no controller).
equipesRouter.post(
  "/:id/etapas",
  authenticate,
  requireRole("mentor", "admin"),
  validate({ params: idParamSchema, body: criarEtapaSchema }),
  controller.criarEtapa
);
