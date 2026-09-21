import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import * as authService from "./auth.service";
import * as sessao from "./sessao.service";
import * as usuariosService from "../usuarios/usuarios.service";

/** POST /auth/login — devolve o token de acesso e grava o refresh token no cookie. */
export async function login(req: Request, res: Response) {
  const usuario = await authService.validarCredenciais(req.body);
  const token = await sessao.abrirSessao(req, res, usuario.id_usuario);
  res.json({ token, usuario });
}

/**
 * POST /auth/refresh — troca o refresh token (cookie) por um token de acesso
 * novo, rotacionando o cookie. O frontend chama sozinho quando recebe 401.
 */
export async function refresh(req: Request, res: Response) {
  const tokenAtual = sessao.lerCookieDeSessao(req);
  if (!tokenAtual) throw AppError.unauthorized("Sem sessão ativa");

  try {
    const { id_usuario, novoToken } = await sessao.rotacionarSessao(tokenAtual);
    sessao.gravarCookieDeSessao(req, res, novoToken);
    const usuario = await usuariosService.buscarUsuarioPorId(id_usuario);
    res.json({ token: sessao.gerarTokenDeAcesso(id_usuario), usuario });
  } catch (err) {
    sessao.apagarCookieDeSessao(req, res);
    throw err;
  }
}

/** POST /auth/logout — encerra a sessão deste navegador. */
export async function logout(req: Request, res: Response) {
  const token = sessao.lerCookieDeSessao(req);
  if (token) await sessao.revogarSessao(token);
  sessao.apagarCookieDeSessao(req, res);
  res.status(204).end();
}

/** Retorna os dados do usuário autenticado — útil pro frontend restaurar a sessão. */
export async function me(req: Request, res: Response) {
  const usuario = await usuariosService.buscarUsuarioPorId(req.usuario!.id_usuario);
  res.json(usuario);
}

/**
 * PATCH /auth/senha — o próprio usuário troca a senha. Por segurança,
 * encerra TODAS as sessões (outros navegadores/dispositivos saem) e abre
 * uma nova só para este.
 */
export async function trocarSenha(req: Request, res: Response) {
  const id_usuario = req.usuario!.id_usuario;
  const usuario = await authService.trocarSenha(id_usuario, req.body);
  await sessao.revogarTodasAsSessoes(id_usuario);
  const token = await sessao.abrirSessao(req, res, id_usuario);
  res.json({ token, usuario });
}
