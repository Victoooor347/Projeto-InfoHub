import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { papelDoUsuarioNaEquipe } from "../equipeUsuarios/equipeUsuarios.service";
import * as service from "./equipes.service";

export async function listar(req: Request, res: Response) {
  const { busca, area, mentor } = req.query as unknown as {
    busca?: string;
    area?: string;
    mentor?: number;
  };
  const equipes = await service.listarEquipes({ busca, area, mentor });
  res.json(equipes);
}

export async function buscarPorId(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };

  if (req.usuario!.perfil === "aluno") {
    const papel = await papelDoUsuarioNaEquipe(req.usuario!.id_usuario, id);
    if (!papel) throw AppError.forbidden("Você não participa desta equipe");
  }

  const equipe = await service.buscarEquipePorId(id);
  res.json(equipe);
}

export async function avancarEtapa(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const { delta } = req.body as { delta: 1 | -1 };
  const equipe = await service.avancarEtapa(id, delta);
  res.json(equipe);
}

export async function marcarPronto(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const { pronto } = req.body as { pronto: boolean };
  const equipe = await service.marcarProntoParaInovAMF(id, pronto);
  res.json(equipe);
}

export async function atualizarLinkPitch(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const { link_pitch } = req.body as { link_pitch: string };

  // admin/mentor sempre podem; um aluno só pode se for líder DESTA equipe
  // (Q1: líder e integrante têm permissões diferentes).
  if (req.usuario!.perfil === "aluno") {
    const papel = await papelDoUsuarioNaEquipe(req.usuario!.id_usuario, id);
    if (papel !== "lider") {
      throw AppError.forbidden("Só o líder da equipe pode atualizar o link do pitch");
    }
  }

  const equipe = await service.atualizarLinkPitch(id, link_pitch);
  res.json(equipe);
}

export async function listarIntegrantes(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };

  // aluno só enxerga os integrantes de uma equipe da qual ele participa
  if (req.usuario!.perfil === "aluno") {
    const papel = await papelDoUsuarioNaEquipe(req.usuario!.id_usuario, id);
    if (!papel) throw AppError.forbidden("Você não participa desta equipe");
  }

  const integrantes = await service.listarIntegrantesDaEquipe(id);
  res.json(integrantes);
}

export async function listarMentores(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };

  // mesma regra de integrantes/etapas: aluno só vê equipes das quais participa
  if (req.usuario!.perfil === "aluno") {
    const papel = await papelDoUsuarioNaEquipe(req.usuario!.id_usuario, id);
    if (!papel) throw AppError.forbidden("Você não participa desta equipe");
  }
  const mentores = await service.listarMentoresDaEquipe(id);
  res.json(mentores);
}

export async function adicionarMentor(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const { id_usuario } = req.body as { id_usuario: number };
  const mentores = await service.adicionarMentor(id, id_usuario);
  res.status(201).json(mentores);
}

export async function removerMentor(req: Request, res: Response) {
  const { id, idUsuario } = req.params as unknown as { id: number; idUsuario: number };
  const mentores = await service.removerMentor(id, idUsuario);
  res.json(mentores);
}

export async function listarEtapas(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };

  if (req.usuario!.perfil === "aluno") {
    const papel = await papelDoUsuarioNaEquipe(req.usuario!.id_usuario, id);
    if (!papel) throw AppError.forbidden("Você não participa desta equipe");
  }

  const etapas = await service.listarEtapasDaEquipe(id);
  res.json(etapas);
}

/**
 * Decisão do InfoHub (WhatsApp): "a jornada padrão segue com 6 etapas,
 * mas o mentor pode acrescentar etapas extras por equipe". Por isso, só
 * quem é mentor DESTA equipe especificamente pode criar — mesmo critério
 * já usado para "só o mentor pode alterar o prazo de uma tarefa"
 * (usuarioEhMentorDaEquipe). Um admin sem vínculo de mentoria com essa
 * equipe não pode, e um mentor de OUTRA equipe também não pode.
 */
export async function criarEtapa(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const { nome, descricao } = req.body as { nome: string; descricao: string };
  const usuario = req.usuario!;

  const ehMentorDestaEquipe = await service.usuarioEhMentorDaEquipe(usuario.id_usuario, id);
  if (!ehMentorDestaEquipe) {
    throw AppError.forbidden("Só um mentor desta equipe pode acrescentar etapas na jornada dela");
  }

  const etapa = await service.criarEtapaExtra(id, nome, descricao, usuario.id_usuario);
  res.status(201).json(etapa);
}
