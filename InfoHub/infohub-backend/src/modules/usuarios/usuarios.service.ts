import bcrypt from "bcryptjs";
import { query } from "../../config/db";
import { AppError } from "../../utils/AppError";
import { USUARIO_COLUNAS_PUBLICAS, type Perfil, type Usuario } from "./usuarios.types";
import type { AtualizarUsuarioInput, CriarUsuarioInput } from "./usuarios.schemas";

export async function listarUsuarios(perfil?: Perfil): Promise<Usuario[]> {
  if (perfil) {
    const r = await query<Usuario>(
      `SELECT ${USUARIO_COLUNAS_PUBLICAS} FROM usuario WHERE perfil = $1 ORDER BY nome`,
      [perfil]
    );
    return r.rows;
  }
  const r = await query<Usuario>(`SELECT ${USUARIO_COLUNAS_PUBLICAS} FROM usuario ORDER BY nome`);
  return r.rows;
}

export async function buscarUsuarioPorId(id: number): Promise<Usuario> {
  const r = await query<Usuario>(`SELECT ${USUARIO_COLUNAS_PUBLICAS} FROM usuario WHERE id_usuario = $1`, [id]);
  if (!r.rows[0]) throw AppError.notFound("Usuário não encontrado");
  return r.rows[0];
}

export async function buscarUsuarioPorEmailComSenha(email: string) {
  const r = await query<Usuario & { senha_hash: string }>(
    `SELECT ${USUARIO_COLUNAS_PUBLICAS}, senha_hash FROM usuario WHERE email = $1`,
    [email]
  );
  return r.rows[0] ?? null;
}

/** RF-03: só admin pode criar contas de administrador/mentor. */
export async function criarUsuarioAdminOuMentor(input: CriarUsuarioInput): Promise<Usuario> {
  const existente = await query(`SELECT 1 FROM usuario WHERE email = $1`, [input.email]);
  if (existente.rowCount) throw AppError.conflict("Já existe uma conta com esse e-mail");

  const senha_hash = await bcrypt.hash(input.senha, 10);
  const r = await query<Usuario>(
    `INSERT INTO usuario (nome, telefone, email, senha_hash, perfil)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${USUARIO_COLUNAS_PUBLICAS}`,
    [input.nome, input.telefone ?? null, input.email, senha_hash, input.perfil]
  );
  return r.rows[0];
}

/** RF-03: editar dados ou desativar/reativar uma conta de admin/mentor. */
export async function atualizarUsuario(id: number, input: AtualizarUsuarioInput): Promise<Usuario> {
  const atual = await buscarUsuarioPorId(id);

  const nome = input.nome ?? atual.nome;
  const telefone = input.telefone !== undefined ? input.telefone : atual.telefone;
  const ativo = input.ativo ?? atual.ativo;

  const r = await query<Usuario>(
    `UPDATE usuario SET nome = $1, telefone = $2, ativo = $3 WHERE id_usuario = $4
     RETURNING ${USUARIO_COLUNAS_PUBLICAS}`,
    [nome, telefone, ativo, id]
  );
  return r.rows[0];
}
