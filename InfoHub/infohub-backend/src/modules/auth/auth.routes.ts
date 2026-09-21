import { Router } from "express";
import { authenticate } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import * as controller from "./auth.controller";
import { loginSchema, trocarSenhaSchema } from "./auth.schemas";

export const authRouter = Router();

authRouter.post("/login", validate({ body: loginSchema }), controller.login);
// refresh e logout usam o cookie httpOnly, não o header Authorization
authRouter.post("/refresh", controller.refresh);
authRouter.post("/logout", controller.logout);
authRouter.get("/me", authenticate, controller.me);
authRouter.patch("/senha", authenticate, validate({ body: trocarSenhaSchema }), controller.trocarSenha);
