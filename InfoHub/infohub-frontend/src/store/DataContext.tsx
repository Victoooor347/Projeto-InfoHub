import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as apiInfoHub from "../services/api";
import { lerArquivoComoBase64, mensagemDeErro } from "../services/http";
import { useAuth } from "./AuthContext";
import type {
  Anotacao,
  AreaIdeia,
  ComoConheceu,
  Curso,
  Entregavel,
  Equipe,
  EquipeMentor,
  EquipeUsuario,
  EstagioIdeia,
  Etapa,
  Lembrete,
  StatusTarefa,
  Tarefa,
  Usuario,
} from "../types";

interface Colega {
  nome: string;
  email: string;
  idCurso: number;
}

interface NovoCadastroInput {
  nomeLider: string;
  telefone: string;
  email: string;
  senha: string;
  idCurso: number;
  semestre: number;
  colegas: Colega[];
  nomeEquipe: string;
  nomeIdeia: string;
  descricaoIdeia: string;
  areaIdeia: AreaIdeia;
  estagioIdeia: EstagioIdeia;
  comoConheceu: ComoConheceu | null;
}

interface DataContextValue {
  cursos: Curso[];
  etapas: Etapa[];
  statusTarefa: StatusTarefa[];
  usuarios: Usuario[];
  equipes: Equipe[];
  equipeUsuarios: EquipeUsuario[];
  tarefas: Tarefa[];
  entregaveis: Entregavel[];
  anotacoes: Anotacao[];
  lembretes: Lembrete[];
  equipeMentores: EquipeMentor[];

  /** true durante a carga dos dados do usuário logado. */
  carregando: boolean;
  /** Falha ao carregar os dados (API fora do ar, por exemplo). */
  erroCarregamento: string | null;
  /** Falha na última ação de escrita — exibida como faixa nos layouts. */
  erroAcao: string | null;
  limparErroAcao: () => void;
  recarregar: () => Promise<void>;

  avancarEtapa: (idEquipe: number, delta: 1 | -1) => Promise<void>;
  criarTarefa: (t: {
    titulo: string;
    descricao: string;
    data_limite: string;
    id_equipe: number;
    id_etapa: number;
  }) => Promise<void>;
  atualizarStatusTarefa: (idTarefa: number, idStatus: number) => Promise<void>;
  atualizarPrazoTarefa: (idTarefa: number, novaData: string) => Promise<void>;
  /** Entrega por link (ex.: YouTube). */
  enviarEntregavel: (idTarefa: number, idUsuario: number, link: string, tipo: string) => Promise<void>;
  /** Entrega por arquivo (upload de verdade). Retorna true se deu certo. */
  enviarArquivoEntregavel: (idTarefa: number, arquivo: File) => Promise<boolean>;
  adicionarAnotacao: (a: Omit<Anotacao, "id_anotacao" | "data_registro">) => Promise<void>;
  /** Envia o e-mail de lembrete agora; retorna o lembrete criado (ou null se falhou). */
  dispararLembreteManual: (idTarefa: number) => Promise<Lembrete | null>;
  marcarProntoParaInovAMF: (idEquipe: number, pronto: boolean) => Promise<void>;
  registrarCadastroInicial: (
    input: NovoCadastroInput
  ) => Promise<apiInfoHub.RespostaInscricao>;
  criarUsuarioAdminOuMentor: (u: {
    nome: string;
    email: string;
    telefone?: string | null;
    senha: string;
    perfil: "admin" | "mentor";
  }) => Promise<void>;
  atualizarLinkPitch: (idEquipe: number, link: string) => Promise<void>;
  adicionarMentor: (idEquipe: number, idUsuario: number) => Promise<void>;
  removerMentor: (idEquipe: number, idUsuario: number) => Promise<void>;
  criarEtapaExtra: (idEquipe: number, nome: string, descricao: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

/** Junta listas de usuários sem repetir ninguém (a mesma pessoa pode vir de várias equipes). */
function mesclarUsuarios(...listas: Usuario[][]): Usuario[] {
  const mapa = new Map<number, Usuario>();
  for (const lista of listas) {
    for (const u of lista) mapa.set(u.id_usuario, u);
  }
  return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome));
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { usuarioAtual, restaurandoSessao } = useAuth();

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [statusTarefa, setStatusTarefa] = useState<StatusTarefa[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [equipeUsuarios, setEquipeUsuarios] = useState<EquipeUsuario[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [entregaveis, setEntregaveis] = useState<Entregavel[]>([]);
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [equipeMentores, setEquipeMentores] = useState<EquipeMentor[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const limparErroAcao = useCallback(() => setErroAcao(null), []);

  /**
   * Cursos e status são rotas públicas na API: a tela de login e o
   * formulário de inscrição precisam deles antes de existir qualquer sessão.
   * Etapa NÃO é mais pública — ela pertence a cada equipe agora, então só
   * dá pra saber quais existem depois de saber quem está logado (ver
   * carregarComoAdmin/carregarComoAluno abaixo).
   */
  useEffect(() => {
    let cancelado = false;
    Promise.all([apiInfoHub.cursos.listar(), apiInfoHub.statusTarefas.listar()])
      .then(([c, s]) => {
        if (cancelado) return;
        setCursos(c);
        setStatusTarefa(s);
      })
      .catch((erro) => {
        if (!cancelado) setErroCarregamento(mensagemDeErro(erro));
      });
    return () => {
      cancelado = true;
    };
  }, []);

  /** Admin e mentor acompanham o sistema inteiro, então usam as rotas de listagem geral. */
  const carregarComoAdmin = useCallback(async () => {
    const [
      usuariosApi,
      equipesApi,
      vinculosApi,
      mentoresApi,
      tarefasApi,
      entregaveisApi,
      anotacoesApi,
      lembretesApi,
      etapasApi,
    ] = await Promise.all([
      apiInfoHub.usuarios.listar(),
      apiInfoHub.equipes.listar(),
      apiInfoHub.equipeUsuarios.listar(),
      apiInfoHub.equipeMentores.listar(),
      apiInfoHub.tarefas.listar(),
      apiInfoHub.entregaveis.listar(),
      apiInfoHub.anotacoes.listar(),
      apiInfoHub.lembretes.listar(),
      apiInfoHub.etapas.listarTodas(),
    ]);

    setUsuarios(usuariosApi);
    setEquipes(equipesApi);
    setEquipeUsuarios(vinculosApi);
    setEquipeMentores(mentoresApi);
    setTarefas(tarefasApi);
    setEntregaveis(entregaveisApi);
    setAnotacoes(anotacoesApi);
    setLembretes(lembretesApi);
    setEtapas(etapasApi);
  }, []);

  /**
   * O aluno não pode listar usuários nem equipes em geral (a API responde 403),
   * então o estado é montado só com o que ele tem direito de ver: as equipes
   * das quais participa, os colegas dessas equipes e as tarefas delas.
   * Etapas também são carregadas só das equipes dele (GET /etapas geral é
   * admin/mentor only — aluno usa GET /equipes/:id/etapas por equipe).
   */
  const carregarComoAluno = useCallback(async (usuario: Usuario) => {
    const meusVinculos = await apiInfoHub.equipeUsuarios.listar();
    const idsEquipes = [...new Set(meusVinculos.map((v) => v.id_equipe))];

    const [equipesApi, integrantesPorEquipe, mentoresApi, tarefasApi, etapasPorEquipe] = await Promise.all([
      Promise.all(idsEquipes.map((id) => apiInfoHub.equipes.buscarPorId(id))),
      Promise.all(idsEquipes.map((id) => apiInfoHub.equipes.listarIntegrantes(id))),
      apiInfoHub.equipeMentores.listar(),
      apiInfoHub.tarefas.listar(),
      Promise.all(idsEquipes.map((id) => apiInfoHub.equipes.listarEtapas(id))),
    ]);

    const integrantes = integrantesPorEquipe.flat();

    setEquipes(equipesApi);
    setEquipeUsuarios(
      integrantes.map((i) => ({
        id_equipe_usuario: i.id_equipe_usuario,
        id_equipe: i.id_equipe,
        id_usuario: i.usuario.id_usuario,
        papel: i.papel,
      }))
    );
    setUsuarios(
      mesclarUsuarios(
        integrantes.map((i) => i.usuario),
        [usuario]
      )
    );
    setEquipeMentores(mentoresApi);
    setTarefas(tarefasApi);
    setEtapas(etapasPorEquipe.flat());

    // entregáveis: o aluno só pode listar por tarefa (a rota geral é de admin/mentor)
    const porTarefa = await Promise.all(
      tarefasApi.map((t) => apiInfoHub.tarefas.listarEntregaveis(t.id_tarefa))
    );
    setEntregaveis(porTarefa.flat());

    // anotações e lembretes são internos da coordenação (RF-10) — aluno nunca vê
    setAnotacoes([]);
    setLembretes([]);
  }, []);

  const limparDadosDoUsuario = useCallback(() => {
    setUsuarios([]);
    setEquipes([]);
    setEquipeUsuarios([]);
    setTarefas([]);
    setEntregaveis([]);
    setAnotacoes([]);
    setLembretes([]);
    setEquipeMentores([]);
    setEtapas([]);
  }, []);

  const recarregar = useCallback(async () => {
    if (!usuarioAtual) {
      limparDadosDoUsuario();
      setCarregando(false);
      return;
    }
    setCarregando(true);
    setErroCarregamento(null);
    try {
      if (usuarioAtual.perfil === "aluno") await carregarComoAluno(usuarioAtual);
      else await carregarComoAdmin();
    } catch (erro) {
      setErroCarregamento(mensagemDeErro(erro));
    } finally {
      setCarregando(false);
    }
  }, [usuarioAtual, carregarComoAluno, carregarComoAdmin, limparDadosDoUsuario]);

  // recarrega sempre que muda quem está logado (login, logout, sessão expirada)
  useEffect(() => {
    if (restaurandoSessao) return;
    recarregar();
  }, [restaurandoSessao, recarregar]);

  /** Executa uma escrita na API guardando a mensagem de erro, em vez de quebrar a tela. */
  const executar = useCallback(async (acao: () => Promise<void>) => {
    setErroAcao(null);
    try {
      await acao();
    } catch (erro) {
      setErroAcao(mensagemDeErro(erro));
    }
  }, []);

  const substituirEquipe = useCallback((equipe: Equipe) => {
    setEquipes((prev) => prev.map((e) => (e.id_equipe === equipe.id_equipe ? equipe : e)));
  }, []);

  const substituirTarefa = useCallback((tarefa: Tarefa) => {
    setTarefas((prev) => prev.map((t) => (t.id_tarefa === tarefa.id_tarefa ? tarefa : t)));
  }, []);

  const avancarEtapa = useCallback(
    (idEquipe: number, delta: 1 | -1) =>
      executar(async () => {
        substituirEquipe(await apiInfoHub.equipes.avancarEtapa(idEquipe, delta));
      }),
    [executar, substituirEquipe]
  );

  const marcarProntoParaInovAMF = useCallback(
    (idEquipe: number, pronto: boolean) =>
      executar(async () => {
        substituirEquipe(await apiInfoHub.equipes.marcarPronto(idEquipe, pronto));
      }),
    [executar, substituirEquipe]
  );

  const atualizarLinkPitch = useCallback(
    (idEquipe: number, link: string) =>
      executar(async () => {
        substituirEquipe(await apiInfoHub.equipes.atualizarLinkPitch(idEquipe, link));
      }),
    [executar, substituirEquipe]
  );

  const criarTarefa = useCallback(
    (t: { titulo: string; descricao: string; data_limite: string; id_equipe: number; id_etapa: number }) =>
      executar(async () => {
        const nova = await apiInfoHub.tarefas.criar(t);
        setTarefas((prev) => [...prev, nova]);
      }),
    [executar]
  );

  const atualizarStatusTarefa = useCallback(
    (idTarefa: number, idStatus: number) =>
      executar(async () => {
        substituirTarefa(await apiInfoHub.tarefas.atualizarStatus(idTarefa, idStatus));
      }),
    [executar, substituirTarefa]
  );

  const atualizarPrazoTarefa = useCallback(
    (idTarefa: number, novaData: string) =>
      executar(async () => {
        substituirTarefa(await apiInfoHub.tarefas.atualizarPrazo(idTarefa, novaData));
      }),
    [executar, substituirTarefa]
  );

  const enviarEntregavel = useCallback(
    (idTarefa: number, _idUsuario: number, arquivoNome: string, tipo: string) =>
      executar(async () => {
        // o autor do envio vem do token no backend — o id passado pela tela é ignorado
        const novo = await apiInfoHub.tarefas.enviarEntregavel(idTarefa, { arquivo_url: arquivoNome, tipo });
        setEntregaveis((prev) => [...prev, novo]);
        // o envio já muda o status da tarefa para "Entregue" no servidor
        substituirTarefa(await apiInfoHub.tarefas.buscarPorId(idTarefa));
      }),
    [executar, substituirTarefa]
  );

  const enviarArquivoEntregavel = useCallback(
    async (idTarefa: number, arquivo: File) => {
      setErroAcao(null);
      try {
        const conteudo_base64 = await lerArquivoComoBase64(arquivo);
        const novo = await apiInfoHub.tarefas.enviarEntregavel(idTarefa, {
          arquivo: { nome: arquivo.name, tipo_mime: arquivo.type || "application/octet-stream", conteudo_base64 },
        });
        setEntregaveis((prev) => [...prev, novo]);
        substituirTarefa(await apiInfoHub.tarefas.buscarPorId(idTarefa));
        return true;
      } catch (erro) {
        setErroAcao(mensagemDeErro(erro));
        return false;
      }
    },
    [substituirTarefa]
  );

  const adicionarAnotacao = useCallback(
    (a: Omit<Anotacao, "id_anotacao" | "data_registro">) =>
      executar(async () => {
        const nova = await apiInfoHub.anotacoes.criar({
          descricao: a.descricao,
          id_equipe: a.id_equipe,
          id_etapa: a.id_etapa,
        });
        setAnotacoes((prev) => [nova, ...prev]);
      }),
    [executar]
  );

  const dispararLembreteManual = useCallback(async (idTarefa: number) => {
    setErroAcao(null);
    try {
      const novo = await apiInfoHub.lembretes.criar(idTarefa);
      setLembretes((prev) => [...prev, novo]);
      return novo;
    } catch (erro) {
      setErroAcao(mensagemDeErro(erro));
      return null;
    }
  }, []);

  const criarUsuarioAdminOuMentor = useCallback(
    (u: { nome: string; email: string; telefone?: string | null; senha: string; perfil: "admin" | "mentor" }) =>
      executar(async () => {
        const novo = await apiInfoHub.usuarios.criar(u);
        setUsuarios((prev) => mesclarUsuarios(prev, [novo]));
      }),
    [executar]
  );

  const adicionarMentor = useCallback(
    (idEquipe: number, idUsuario: number) =>
      executar(async () => {
        const mentores = await apiInfoHub.equipes.adicionarMentor(idEquipe, idUsuario);
        setEquipeMentores((prev) => [
          ...prev.filter((em) => em.id_equipe !== idEquipe),
          ...mentores.map((m) => ({ id_equipe: idEquipe, id_usuario: m.id_usuario })),
        ]);
        setUsuarios((prev) => mesclarUsuarios(prev, mentores));
        // o backend também ajusta equipe.id_mentor (o "mentor principal")
        substituirEquipe(await apiInfoHub.equipes.buscarPorId(idEquipe));
      }),
    [executar, substituirEquipe]
  );

  const removerMentor = useCallback(
    (idEquipe: number, idUsuario: number) =>
      executar(async () => {
        const mentores = await apiInfoHub.equipes.removerMentor(idEquipe, idUsuario);
        setEquipeMentores((prev) => [
          ...prev.filter((em) => em.id_equipe !== idEquipe),
          ...mentores.map((m) => ({ id_equipe: idEquipe, id_usuario: m.id_usuario })),
        ]);
        substituirEquipe(await apiInfoHub.equipes.buscarPorId(idEquipe));
      }),
    [executar, substituirEquipe]
  );

  /**
   * Decisão do InfoHub (WhatsApp): só o mentor DESTA equipe pode
   * acrescentar uma etapa extra na jornada dela. O backend já valida isso
   * (403 se não for); aqui só propagamos o resultado pro estado local.
   */
  const criarEtapaExtra = useCallback(
    (idEquipe: number, nome: string, descricao: string) =>
      executar(async () => {
        const nova = await apiInfoHub.equipes.criarEtapa(idEquipe, nome, descricao);
        setEtapas((prev) => [...prev, nova]);
      }),
    [executar]
  );

  /**
   * RF-02: cadastro inicial da equipe. É rota pública e já devolve o token do
   * líder. Esta função propaga o erro em vez de engoli-lo: a tela de inscrição
   * precisa mostrar a validação campo a campo vinda do Zod.
   */
  const registrarCadastroInicial = useCallback(async (input: NovoCadastroInput) => {
    return apiInfoHub.inscricao.enviar({
      nome_lider: input.nomeLider,
      telefone: input.telefone,
      email: input.email,
      senha: input.senha,
      id_curso: input.idCurso,
      semestre: input.semestre,
      colegas: input.colegas
        .filter((c) => c.email.trim())
        .map((c) => ({ nome: c.nome.trim() || undefined, email: c.email.trim(), id_curso: c.idCurso })),
      nome_equipe: input.nomeEquipe,
      nome_ideia: input.nomeIdeia,
      descricao_ideia: input.descricaoIdeia,
      area_ideia: input.areaIdeia,
      estagio_ideia: input.estagioIdeia,
      como_conheceu: input.comoConheceu,
    });
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      cursos,
      etapas,
      statusTarefa,
      usuarios,
      equipes,
      equipeUsuarios,
      tarefas,
      entregaveis,
      anotacoes,
      lembretes,
      equipeMentores,
      carregando,
      erroCarregamento,
      erroAcao,
      limparErroAcao,
      recarregar,
      avancarEtapa,
      criarTarefa,
      atualizarStatusTarefa,
      atualizarPrazoTarefa,
      enviarEntregavel,
      enviarArquivoEntregavel,
      adicionarAnotacao,
      dispararLembreteManual,
      marcarProntoParaInovAMF,
      registrarCadastroInicial,
      criarUsuarioAdminOuMentor,
      atualizarLinkPitch,
      adicionarMentor,
      removerMentor,
      criarEtapaExtra,
    }),
    [
      cursos,
      etapas,
      statusTarefa,
      usuarios,
      equipes,
      equipeUsuarios,
      tarefas,
      entregaveis,
      anotacoes,
      lembretes,
      equipeMentores,
      carregando,
      erroCarregamento,
      erroAcao,
      limparErroAcao,
      recarregar,
      avancarEtapa,
      criarTarefa,
      atualizarStatusTarefa,
      atualizarPrazoTarefa,
      enviarEntregavel,
      enviarArquivoEntregavel,
      adicionarAnotacao,
      dispararLembreteManual,
      marcarProntoParaInovAMF,
      registrarCadastroInicial,
      criarUsuarioAdminOuMentor,
      atualizarLinkPitch,
      adicionarMentor,
      removerMentor,
      criarEtapaExtra,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData deve ser usado dentro de DataProvider");
  return ctx;
}
