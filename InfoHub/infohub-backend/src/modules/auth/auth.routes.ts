import { Router } from "express";
import { authenticate } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import * as controller from "./auth.controller";
import { loginSchema } from "./auth.schemas";

export const authRouter = Router();

authRouter.post("/login", validate({ body: loginSchema }), controller.login);
authRouter.get("/me", authenticate, controller.me);
