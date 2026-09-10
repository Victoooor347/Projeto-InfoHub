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

export async function listarMentores(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
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
