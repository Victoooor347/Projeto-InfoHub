import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { query } from "../config/db";
import { AppError } from "../utils/AppError";
import type { Perfil } from "../modules/usuarios/usuarios.types";

interface AppJwtPayload {
  sub: number;
}

/**
 * Exige um token JWT válido no header Authorization: Bearer <token>.
 * Recarrega o usuário do banco a cada request (em vez de confiar só no
 * payload do token) para que uma conta desativada (RF-03) perca acesso
 * imediatamente, sem esperar o token expirar.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw AppError.unauthorized("Token não informado");
    }
    const token = header.slice("Bearer ".length);

    let payload: AppJwtPayload;
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as unknown;
      const sub = Number((decoded as { sub?: unknown })?.sub);
      if (!Number.isInteger(sub)) throw new Error("payload sem sub numérico");
      payload = { sub };
    } catch {
      throw AppError.unauthorized("Token inválido ou expirado");
    }

    const result = await query<{
      id_usuario: number;
      nome: string;
      email: string;
      perfil: Perfil;
      ativo: boolean;
    }>(`SELECT id_usuario, nome, email, perfil, ativo FROM usuario WHERE id_usuario = $1`, [payload.sub]);

    const usuario = result.rows[0];
    if (!usuario) throw AppError.unauthorized("Usuário do token não existe mais");
    if (!usuario.ativo) throw AppError.forbidden("Esta conta foi desativada");

    req.usuario = {
      id_usuario: usuario.id_usuario,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    };
    next();
  } catch (err) {
    next(err);
  }
}

/** Restringe a rota a um subconjunto de perfis (ex.: requireRole('admin')). */
export function requireRole(...perfis: Perfil[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.usuario) return next(AppError.unauthorized());
    if (!perfis.includes(req.usuario.perfil)) {
      return next(AppError.forbidden(`Esta ação é restrita a: ${perfis.join(", ")}`));
    }
    next();
  };
}
