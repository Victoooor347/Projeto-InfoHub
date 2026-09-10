import { Router } from "express";
import type { Request, Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";
import { validate } from "../../middlewares/validate";
import { inscricaoSchema } from "./inscricao.schemas";
import { registrarCadastroInicial } from "./inscricao.service";

export const inscricaoRouter = Router();

// Rota pública — é assim que uma equipe nova entra no sistema (RF-02).
inscricaoRouter.post("/", validate({ body: inscricaoSchema }), async (req: Request, res: Response) => {
  const { usuario, equipe } = await registrarCadastroInicial(req.body);

  // devolve token já logado, igual ao comportamento do frontend mock
  // (entrarComo() após o cadastro), para o aluno cair direto na área dele.
  const token = jwt.sign({ sub: usuario.id_usuario }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions);

  res.status(201).json({ token, usuario, equipe });
});
