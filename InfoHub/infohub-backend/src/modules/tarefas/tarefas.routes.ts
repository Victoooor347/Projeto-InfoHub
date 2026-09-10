import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import * as controller from "./tarefas.controller";
import {
  atualizarPrazoSchema,
  atualizarStatusSchema,
  criarTarefaSchema,
  enviarEntregavelSchema,
  idParamSchema,
  listarTarefasQuerySchema,
} from "./tarefas.schemas";

export const tarefasRouter = Router();

// listar/buscar: aberto a qualquer perfil autenticado — o controller filtra
// por participação quando o usuário é aluno.
tarefasRouter.get("/", authenticate, validate({ query: listarTarefasQuerySchema }), controller.listar);
tarefasRouter.get("/:id", authenticate, validate({ params: idParamSchema }), controller.buscarPorId);

// RF-11/RF-12: criar tarefa — admin/mentor
tarefasRouter.post(
  "/",
  authenticate,
  requireRole("admin", "mentor"),
  validate({ body: criarTarefaSchema }),
  controller.criar
);

// RF-15: aprovar / pedir ajuste — admin/mentor
tarefasRouter.patch(
  "/:id/status",
  authenticate,
  requireRole("admin", "mentor"),
  validate({ params: idParamSchema, body: atualizarStatusSchema }),
  controller.atualizarStatus
);

// só mentor (ou admin-mentor daquela equipe) — checagem fina no controller
tarefasRouter.patch(
  "/:id/prazo",
  authenticate,
  requireRole("admin", "mentor"),
  validate({ params: idParamSchema, body: atualizarPrazoSchema }),
  controller.atualizarPrazo
);

// RF-14: só o líder da equipe (aluno) — checagem fina no controller
tarefasRouter.post(
  "/:id/entregaveis",
  authenticate,
  validate({ params: idParamSchema, body: enviarEntregavelSchema }),
  controller.enviarEntregavel
);

tarefasRouter.get(
  "/:id/entregaveis",
  authenticate,
  validate({ params: idParamSchema }),
  controller.listarEntregaveis
);
