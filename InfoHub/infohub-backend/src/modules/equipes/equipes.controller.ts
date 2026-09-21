import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { filtrarPorEquipesVisiveis, garantirAcessoEquipe } from "../../utils/acessoEquipe";
import { papelDoUsuarioNaEquipe } from "../equipeUsuarios/equipeUsuarios.service";
import * as service from "./equipes.service";

/*
 * Acesso (seção 2 dos requisitos): admin vê todas as equipes; mentor só as
 * que ele mentora (equipe_mentor); aluno só as que participa. A checagem
 * fica em utils/acessoEquipe.ts.
 */

export async function listar(req: Request, res: Response) {
  const { busca, area, mentor } = req.query as unknown as {
    busca?: string;
    area?: string;
    mentor?: number;
  };
  const equipes = await service.listarEquipes({ busca, area, mentor });
  res.json(await filtrarPorEquipesVisiveis(req.usuario!, equipes));
}

export async function buscarPorId(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  await garantirAcessoEquipe(req.usuario!, id);
  res.json(await service.buscarEquipePorId(id));
}

export async function avancarEtapa(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const { delta } = req.body as { delta: 1 | -1 };
  await garantirAcessoEquipe(req.usuario!, id);
  res.json(await service.avancarEtapa(id, delta));
}

export async function marcarPronto(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const { pronto } = req.body as { pronto: boolean };
  await garantirAcessoEquipe(req.usuario!, id);
  res.json(await service.marcarProntoParaInovAMF(id, pronto));
}

export async function atualizarLinkPitch(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const { link_pitch } = req.body as { link_pitch: string };

  await garantirAcessoEquipe(req.usuario!, id);
  // além de participar, o aluno precisa ser o LÍDER desta equipe
  // (Q1: líder e integrante têm permissões diferentes).
  if (req.usuario!.perfil === "aluno") {
    const papel = await papelDoUsuarioNaEquipe(req.usuario!.id_usuario, id);
    if (papel !== "lider") {
      throw AppError.forbidden("Só o líder da equipe pode atualizar o link do pitch");
    }
  }

  res.json(await service.atualizarLinkPitch(id, link_pitch));
}

export async function listarIntegrantes(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  await garantirAcessoEquipe(req.usuario!, id);
  res.json(await service.listarIntegrantesDaEquipe(id));
}

export async function listarMentores(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  await garantirAcessoEquipe(req.usuario!, id);
  res.json(await service.listarMentoresDaEquipe(id));
}

/** Só admin (ver rota): é o admin quem atribui mentores às equipes. */
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
  await garantirAcessoEquipe(req.usuario!, id);
  res.json(await service.listarEtapasDaEquipe(id));
}

/**
 * Decisão do InfoHub (WhatsApp): "a jornada padrão segue com 6 etapas,
 * mas o mentor pode acrescentar etapas extras por equipe". Por isso, só
 * quem é mentor DESTA equipe especificamente pode criar. Um admin sem
 * vínculo de mentoria com essa equipe não pode, e um mentor de OUTRA
 * equipe também não pode.
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
