import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { buscarUsuarioPorEmailComSenha } from "../usuarios/usuarios.service";
import type { LoginInput } from "./auth.schemas";

export async function login(input: LoginInput) {
  const usuario = await buscarUsuarioPorEmailComSenha(input.email);
  if (!usuario) throw AppError.unauthorized("E-mail ou senha inválidos");

  const senhaOk = await bcrypt.compare(input.senha, usuario.senha_hash);
  if (!senhaOk) throw AppError.unauthorized("E-mail ou senha inválidos");

  if (!usuario.ativo) throw AppError.forbidden("Esta conta foi desativada");

  const token = jwt.sign({ sub: usuario.id_usuario }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions);

  const { senha_hash, ...usuarioPublico } = usuario;
  return { token, usuario: usuarioPublico };
}
