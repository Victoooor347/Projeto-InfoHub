import { Router } from "express";
import type { Request } from "express";
import type { Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { query } from "../../config/db";
import { validate } from "../../middlewares/validate";
import { abrirSessao } from "../auth/sessao.service";
import { inscricaoSchema } from "./inscricao.schemas";
import { registrarCadastroInicial } from "./inscricao.service";

export const inscricaoRouter = Router();

/**
 * A rota é pública, mas o admin também a usa (botão "Nova equipe"). Nesse
 * caso a requisição chega com o token do admin — e NÃO podemos abrir uma
 * sessão do líder no navegador dele (o cookie de sessão do admin seria
 * substituído pelo do aluno).
 */
async function feitaPorAdmin(req: Request): Promise<boolean> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return false;
  try {
    const decoded = jwt.verify(header.slice("Bearer ".length), env.JWT_SECRET) as { sub?: unknown };
    const r = await query<{ perfil: string }>(`SELECT perfil FROM usuario WHERE id_usuario = $1 AND ativo = TRUE`, [
      Number(decoded.sub),
    ]);
    return r.rows[0]?.perfil === "admin";
  } catch {
    return false;
  }
}

// Rota pública — é assim que uma equipe nova entra no sistema (RF-02).
inscricaoRouter.post("/", validate({ body: inscricaoSchema }), async (req: Request, res: Response) => {
  const porAdmin = await feitaPorAdmin(req);
  const { usuario, equipe, colegasCriados } = await registrarCadastroInicial(req.body, { porAdmin });

  // colegas_criados: senhas provisórias dos colegas que ganharam conta nova
  // agora. Só aparecem nesta resposta (não ficam guardadas em texto em lugar nenhum).
  if (porAdmin) {
    return res.status(201).json({ token: null, usuario, equipe, colegas_criados: colegasCriados });
  }

  // aluno se inscrevendo sozinho: já sai logado (token + cookie de sessão)
  const token = await abrirSessao(req, res, usuario.id_usuario);
  res.status(201).json({ token, usuario, equipe, colegas_criados: colegasCriados });
});
