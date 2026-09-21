import { createHash, randomBytes } from "node:crypto";
import type { CookieOptions, Request, Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";
import { query } from "../../config/db";
import { AppError } from "../../utils/AppError";

/**
 * Sessões com refresh token.
 *
 *  - token de ACESSO: JWT curto (JWT_EXPIRES_IN, padrão 15 min), mandado no
 *    header Authorization. Se vazar, vale por pouco tempo.
 *  - refresh token: aleatório, longo (REFRESH_TOKEN_DIAS, padrão 7 dias),
 *    num cookie httpOnly — JavaScript da página não consegue lê-lo, o que
 *    protege contra roubo via XSS. No banco fica só o hash dele.
 *
 * Rotação: toda renovação revoga o refresh token usado e emite outro. Se um
 * token JÁ revogado for apresentado de novo, é sinal de que alguém copiou o
 * cookie — então TODAS as sessões do usuário são encerradas.
 */

export const NOME_COOKIE = "infohub_refresh";
const CAMINHO_COOKIE = "/api/auth"; // o cookie só viaja nas rotas de autenticação

/**
 * Janela em que um token recém-rotacionado ainda é aceito. Cobre o caso
 * normal de duas abas renovando ao mesmo tempo (sem isso, a segunda aba
 * seria confundida com um ataque e derrubaria as duas).
 */
const TOLERANCIA_CONCORRENCIA_SEGUNDOS = 30;

function hashDoToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function gerarTokenDeAcesso(id_usuario: number): string {
  return jwt.sign({ sub: id_usuario }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as SignOptions);
}

/** Abre uma sessão nova e devolve o refresh token (valor em claro, só para o cookie). */
export async function criarSessao(id_usuario: number): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await query(
    `INSERT INTO sessao (id_usuario, token_hash, expira_em)
     VALUES ($1, $2, now() + make_interval(days => $3))`,
    [id_usuario, hashDoToken(token), env.REFRESH_TOKEN_DIAS]
  );
  return token;
}

/** Troca um refresh token válido por um novo. Devolve o usuário e o novo token. */
export async function rotacionarSessao(token: string): Promise<{ id_usuario: number; novoToken: string }> {
  const r = await query<{
    id_sessao: number;
    id_usuario: number;
    expirada: boolean;
    revogado_em: string | null;
    revogada_agora_ha_pouco: boolean;
    ativo: boolean;
  }>(
    `SELECT s.id_sessao, s.id_usuario, s.expira_em < now() AS expirada, s.revogado_em,
            (s.revogado_em > now() - make_interval(secs => $2)) AS revogada_agora_ha_pouco,
            u.ativo
       FROM sessao s JOIN usuario u ON u.id_usuario = s.id_usuario
      WHERE s.token_hash = $1`,
    [hashDoToken(token), TOLERANCIA_CONCORRENCIA_SEGUNDOS]
  );
  const sessao = r.rows[0];
  if (!sessao) throw AppError.unauthorized("Sessão não encontrada. Entre novamente.");

  if (sessao.revogado_em && !sessao.revogada_agora_ha_pouco) {
    // reutilização de um token antigo → possível roubo: encerra tudo
    await revogarTodasAsSessoes(sessao.id_usuario);
    throw AppError.unauthorized("Sessão encerrada por segurança. Entre novamente.");
  }
  if (sessao.expirada) throw AppError.unauthorized("Sua sessão expirou. Entre novamente.");
  if (!sessao.ativo) throw AppError.forbidden("Esta conta foi desativada");

  if (!sessao.revogado_em) {
    await query(`UPDATE sessao SET revogado_em = now() WHERE id_sessao = $1`, [sessao.id_sessao]);
  }
  const novoToken = await criarSessao(sessao.id_usuario);
  return { id_usuario: sessao.id_usuario, novoToken };
}

export async function revogarSessao(token: string): Promise<void> {
  await query(`UPDATE sessao SET revogado_em = now() WHERE token_hash = $1 AND revogado_em IS NULL`, [
    hashDoToken(token),
  ]);
}

/** Encerra todas as sessões abertas do usuário (ex.: após trocar a senha). */
export async function revogarTodasAsSessoes(id_usuario: number): Promise<void> {
  await query(`UPDATE sessao SET revogado_em = now() WHERE id_usuario = $1 AND revogado_em IS NULL`, [id_usuario]);
  // aproveita para limpar sessões velhas desse usuário
  await query(`DELETE FROM sessao WHERE id_usuario = $1 AND expira_em < now() - interval '1 day'`, [id_usuario]);
}

// ------------------------------------------------------------------ cookie

function opcoesDoCookie(req: Request): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    // só exige HTTPS quando o acesso é por HTTPS (o servidor da faculdade usa http)
    secure: req.secure,
    path: CAMINHO_COOKIE,
  };
}

export function gravarCookieDeSessao(req: Request, res: Response, token: string) {
  res.cookie(NOME_COOKIE, token, { ...opcoesDoCookie(req), maxAge: env.REFRESH_TOKEN_DIAS * 24 * 60 * 60 * 1000 });
}

export function apagarCookieDeSessao(req: Request, res: Response) {
  res.clearCookie(NOME_COOKIE, opcoesDoCookie(req));
}

/** Lê o refresh token do cabeçalho Cookie (sem precisar da lib cookie-parser). */
export function lerCookieDeSessao(req: Request): string | null {
  const cabecalho = req.headers.cookie;
  if (!cabecalho) return null;
  for (const parte of cabecalho.split(";")) {
    const [nome, ...resto] = parte.trim().split("=");
    if (nome === NOME_COOKIE) return decodeURIComponent(resto.join("="));
  }
  return null;
}

/** Login completo: sessão nova + cookie + token de acesso. */
export async function abrirSessao(req: Request, res: Response, id_usuario: number): Promise<string> {
  gravarCookieDeSessao(req, res, await criarSessao(id_usuario));
  return gerarTokenDeAcesso(id_usuario);
}
