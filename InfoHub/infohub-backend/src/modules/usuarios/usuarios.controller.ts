import type { Request, Response } from "express";
import * as usuariosService from "./usuarios.service";

export async function listar(req: Request, res: Response) {
  const { perfil } = req.query as { perfil?: "aluno" | "mentor" | "admin" };
  const usuarios = await usuariosService.listarUsuarios(perfil);
  res.json(usuarios);
}

export async function buscarPorId(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const usuario = await usuariosService.buscarUsuarioPorId(id);
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
