import type { Request, Response } from "express";
import * as authService from "./auth.service";
import * as usuariosService from "../usuarios/usuarios.service";

export async function login(req: Request, res: Response) {
  const resultado = await authService.login(req.body);
  res.json(resultado);
}

/** Retorna os dados do usuário autenticado — útil pro frontend restaurar a sessão. */
export async function me(req: Request, res: Response) {
  const usuario = await usuariosService.buscarUsuarioPorId(req.usuario!.id_usuario);
  res.json(usuario);
}
