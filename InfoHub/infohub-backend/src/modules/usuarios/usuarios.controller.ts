import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { equipesVisiveis } from "../../utils/acessoEquipe";
import { query } from "../../config/db";
import * as usuariosService from "./usuarios.service";
import type { Usuario } from "./usuarios.types";

/**
 * Mentor é restrito às equipes que mentora (seção 2 dos requisitos): ele
 * enxerga a equipe InfoHub (admins e mentores, necessária para as telas) e
 * os alunos das equipes dele — não os alunos de outras equipes.
 */
async function filtrarParaMentor(req: Request, usuarios: Usuario[]): Promise<Usuario[]> {
  const visiveis = await equipesVisiveis(req.usuario!);
  if (visiveis === null) return usuarios; // admin

  const r = await query<{ id_usuario: number }>(
    `SELECT DISTINCT id_usuario FROM equipe_usuario WHERE id_equipe = ANY($1::int[])`,
    [visiveis]
  );
  const alunosPermitidos = new Set(r.rows.map((row) => row.id_usuario));
  return usuarios.filter((u) => u.perfil !== "aluno" || alunosPermitidos.has(u.id_usuario));
}

export async function listar(req: Request, res: Response) {
  const { perfil } = req.query as { perfil?: "aluno" | "mentor" | "admin" };
  const usuarios = await usuariosService.listarUsuarios(perfil);
  res.json(await filtrarParaMentor(req, usuarios));
}

export async function buscarPorId(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const usuario = await usuariosService.buscarUsuarioPorId(id);
  const [visivel] = await filtrarParaMentor(req, [usuario]);
  if (!visivel) throw AppError.forbidden("Este aluno não pertence a nenhuma equipe sob sua mentoria");
  res.json(usuario);
}

export async function criar(req: Request, res: Response) {
  const usuario = await usuariosService.criarUsuarioAdminOuMentor(req.body);
  res.status(201).json(usuario);
}

export async function atualizar(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const usuario = await usuariosService.atualizarUsuario(id, req.body);
  res.json(usuario);
}
