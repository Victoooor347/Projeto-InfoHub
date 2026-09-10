import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import * as controller from "./usuarios.controller";
import {
  atualizarUsuarioSchema,
  criarUsuarioSchema,
  idParamSchema,
  listarUsuariosQuerySchema,
} from "./usuarios.schemas";

export const usuariosRouter = Router();

// Listar usuários é usado pelo admin/mentor pra montar seletores de mentor,
// líder da equipe etc. — nunca expõe senha_hash (ver USUARIO_COLUNAS_PUBLICAS).
usuariosRouter.get(
  "/",
  authenticate,
  requireRole("admin", "mentor"),
  validate({ query: listarUsuariosQuerySchema }),
  controller.listar
);

usuariosRouter.get(
  "/:id",
  authenticate,
  requireRole("admin", "mentor"),
  validate({ params: idParamSchema }),
  controller.buscarPorId
);

// RF-03: só admin cria contas de administrador/mentor
usuariosRouter.post(
  "/",
  authenticate,
  requireRole("admin"),
  validate({ body: criarUsuarioSchema }),
  controller.criar
);

// RF-03: só admin edita/desativa contas de administrador/mentor
usuariosRouter.patch(
  "/:id",
  authenticate,
  requireRole("admin"),
  validate({ params: idParamSchema, body: atualizarUsuarioSchema }),
  controller.atualizar
);
