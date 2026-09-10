import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { getEquipesDoUsuario, papelDoUsuarioNaEquipe } from "../equipeUsuarios/equipeUsuarios.service";
import { usuarioEhMentorDaEquipe } from "../equipes/equipes.service";
import * as service from "./tarefas.service";

export async function listar(req: Request, res: Response) {
  const { id_equipe, id_status } = req.query as unknown as { id_equipe?: number; id_status?: number };

  if (req.usuario!.perfil === "aluno") {
    if (id_equipe) {
      const papel = await papelDoUsuarioNaEquipe(req.usuario!.id_usuario, id_equipe);
      if (!papel) throw AppError.forbidden("Você não participa desta equipe");
      return res.json(await service.listarTarefas({ id_equipe, id_status }));
    }
    const idsEquipes = await getEquipesDoUsuario(req.usuario!.id_usuario);
    if (idsEquipes.length === 0) return res.json([]);
    const todas = await Promise.all(idsEquipes.map((id) => service.listarTarefas({ id_equipe: id, id_status })));
    return res.json(todas.flat());
  }

  res.json(await service.listarTarefas({ id_equipe, id_status }));
}

export async function buscarPorId(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const tarefa = await service.buscarTarefaPorId(id);

  if (req.usuario!.perfil === "aluno") {
    const papel = await papelDoUsuarioNaEquipe(req.usuario!.id_usuario, tarefa.id_equipe);
    if (!papel) throw AppError.forbidden("Você não participa da equipe dona desta tarefa");
  }

  res.json(tarefa);
}

export async function criar(req: Request, res: Response) {
  const tarefa = await service.criarTarefa(req.body);
  res.status(201).json(tarefa);
}

/** RF-15: aprovar ou pedir ajuste — restrito a admin/mentor (ver rota). */
export async function atualizarStatus(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const { id_status } = req.body as { id_status: number };
  const tarefa = await service.atualizarStatus(id, id_status);
  res.json(tarefa);
}

/**
 * Esclarecido com o cliente: só o mentor pode alterar o prazo.
 * "Mentor" aqui significa: tem perfil='mentor' (mentor acompanha o sistema
 * todo), OU é admin mas foi explicitamente adicionado como mentor DESTA
 * equipe em equipe_mentor (ver conversa "e se um admin quiser ser mentor?").
 * Um admin comum, sem vínculo de mentoria com a equipe, não pode.
 */
export async function atualizarPrazo(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const { data_limite } = req.body as { data_limite: string };

  const tarefa = await service.buscarTarefaPorId(id);
  const usuario = req.usuario!;
  const podeEditar =
    usuario.perfil === "mentor" || (await usuarioEhMentorDaEquipe(usuario.id_usuario, tarefa.id_equipe));
  if (!podeEditar) {
    throw AppError.forbidden("Só o mentor pode alterar o prazo de uma tarefa");
  }

  const atualizada = await service.atualizarPrazo(id, data_limite);
  res.json(atualizada);
}

/**
 * RF-14: só o líder da equipe pode enviar entregável (Q1 — líder e
 * integrante têm permissões diferentes). Admin/mentor não enviam
 * entregável em nome do aluno.
 */
export async function enviarEntregavel(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const { arquivo_url, tipo } = req.body as { arquivo_url: string; tipo?: string };
  const usuario = req.usuario!;

  if (usuario.perfil !== "aluno") {
    throw AppError.forbidden("Só o aluno líder da equipe pode enviar entregáveis");
  }

  const tarefa = await service.buscarTarefaPorId(id);
  const papel = await papelDoUsuarioNaEquipe(usuario.id_usuario, tarefa.id_equipe);
  if (papel !== "lider") {
    throw AppError.forbidden("Só o líder da equipe pode enviar entregáveis desta tarefa");
  }

  const entregavel = await service.enviarEntregavel(id, usuario.id_usuario, arquivo_url, tipo);
  res.status(201).json(entregavel);
}

export async function listarEntregaveis(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const tarefa = await service.buscarTarefaPorId(id);

  if (req.usuario!.perfil === "aluno") {
    const papel = await papelDoUsuarioNaEquipe(req.usuario!.id_usuario, tarefa.id_equipe);
    if (!papel) throw AppError.forbidden("Você não participa da equipe dona desta tarefa");
  }

  res.json(await service.listarEntregaveis(id));
}
