import bcrypt from "bcryptjs";
import { query } from "../../config/db";
import { AppError } from "../../utils/AppError";
import { buscarUsuarioPorEmailComSenha } from "../usuarios/usuarios.service";
import { USUARIO_COLUNAS_PUBLICAS, type Usuario } from "../usuarios/usuarios.types";
import type { LoginInput, TrocarSenhaInput } from "./auth.schemas";

/** Confere e-mail e senha. Quem gera os tokens é o controller (sessao.service). */
export async function validarCredenciais(input: LoginInput): Promise<Usuario> {
  const usuario = await buscarUsuarioPorEmailComSenha(input.email);
  if (!usuario) throw AppError.unauthorized("E-mail ou senha inválidos");

  const senhaOk = await bcrypt.compare(input.senha, usuario.senha_hash);
  if (!senhaOk) throw AppError.unauthorized("E-mail ou senha inválidos");

  if (!usuario.ativo) throw AppError.forbidden("Esta conta foi desativada");

  const { senha_hash: _senhaHash, ...usuarioPublico } = usuario;
  return usuarioPublico;
}

/**
 * Troca a senha do próprio usuário, conferindo a atual. Também limpa a
 * marca de "senha provisória". Encerrar as outras sessões fica no controller.
 */
export async function trocarSenha(id_usuario: number, input: TrocarSenhaInput): Promise<Usuario> {
  const r = await query<{ senha_hash: string }>(`SELECT senha_hash FROM usuario WHERE id_usuario = $1`, [id_usuario]);
  if (!r.rows[0]) throw AppError.notFound("Usuário não encontrado");

  const senhaOk = await bcrypt.compare(input.senha_atual, r.rows[0].senha_hash);
  if (!senhaOk) throw AppError.badRequest("A senha atual está incorreta");

  const novoHash = await bcrypt.hash(input.nova_senha, 10);
  const atualizado = await query<Usuario>(
    `UPDATE usuario SET senha_hash = $1, deve_trocar_senha = FALSE WHERE id_usuario = $2
     RETURNING ${USUARIO_COLUNAS_PUBLICAS}`,
    [novoHash, id_usuario]
  );
  return atualizado.rows[0];
}
