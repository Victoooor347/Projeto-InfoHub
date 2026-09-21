import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { equipesVisiveis, garantirAcessoEquipe } from "../../utils/acessoEquipe";
import { papelDoUsuarioNaEquipe } from "../equipeUsuarios/equipeUsuarios.service";
import * as service from "./tarefas.service";

/*
 * Acesso (seção 2 dos requisitos): admin vê as tarefas de todas as equipes;
 * mentor só das equipes que mentora; aluno só das equipes que participa.
 */

export async function listar(req: Request, res: Response) {
  const { id_equipe, id_status } = req.query as unknown as { id_equipe?: number; id_status?: number };

  if (id_equipe) {
    await garantirAcessoEquipe(req.usuario!, id_equipe);
    return res.json(await service.listarTarefas({ id_equipe, id_status }));
  }

  const visiveis = await equipesVisiveis(req.usuario!);
  if (visiveis === null) return res.json(await service.listarTarefas({ id_status }));
  if (visiveis.length === 0) return res.json([]);

  const porEquipe = await Promise.all(visiveis.map((id) => service.listarTarefas({ id_equipe: id, id_status })));
  res.json(porEquipe.flat());
}

export async function buscarPorId(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const tarefa = await service.buscarTarefaPorId(id);
  await garantirAcessoEquipe(req.usuario!, tarefa.id_equipe);
  res.json(tarefa);
}

/** Admin cria para qualquer equipe; mentor só para as equipes que mentora. */
export async function criar(req: Request, res: Response) {
  const { id_equipe } = req.body as { id_equipe: number };
  await garantirAcessoEquipe(req.usuario!, id_equipe);
  const tarefa = await service.criarTarefa(req.body);
  res.status(201).json(tarefa);
}

/** RF-15: aprovar ou pedir ajuste — admin, ou mentor desta equipe. */
export async function atualizarStatus(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const { id_status } = req.body as { id_status: number };
  const tarefa = await service.buscarTarefaPorId(id);
  await garantirAcessoEquipe(req.usuario!, tarefa.id_equipe);
  res.json(await service.atualizarStatus(id, id_status));
}

/**
 * Requisito (seção 2): o administrador "define e atribui tarefas e prazos",
 * e o mentor tem as mesmas permissões restritas às próprias equipes.
 * Então: admin altera o prazo de qualquer tarefa; mentor só das equipes
 * que mentora. (Antes, um admin sem vínculo de mentoria não podia.)
 */
export async function atualizarPrazo(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const { data_limite } = req.body as { data_limite: string };
  const tarefa = await service.buscarTarefaPorId(id);
  await garantirAcessoEquipe(req.usuario!, tarefa.id_equipe);
  res.json(await service.atualizarPrazo(id, data_limite));
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
  await garantirAcessoEquipe(req.usuario!, tarefa.id_equipe);
  res.json(await service.listarEntregaveis(id));
}
