import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  cursos as seedCursos,
  etapas as seedEtapas,
  statusTarefa as seedStatusTarefa,
  usuarios as seedUsuarios,
  equipes as seedEquipes,
  equipeUsuarios as seedEquipeUsuarios,
  tarefas as seedTarefas,
  entregaveis as seedEntregaveis,
  anotacoes as seedAnotacoes,
  lembretes as seedLembretes,
  equipeMentores as seedEquipeMentores,
} from "../data/mockData";
import type {
  Curso,
  Etapa,
  StatusTarefa,
  Usuario,
  Equipe,
  EquipeUsuario,
  Tarefa,
  Entregavel,
  Anotacao,
  Lembrete,
  EquipeMentor,
  AreaIdeia,
  EstagioIdeia,
  ComoConheceu,
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

  avancarEtapa: (idEquipe: number, delta: 1 | -1) => void;
  criarTarefa: (t: Omit<Tarefa, "id_tarefa" | "id_status"> & { id_status?: number }) => void;
  atualizarStatusTarefa: (idTarefa: number, idStatus: number) => void;
  atualizarPrazoTarefa: (idTarefa: number, novaData: string) => void;
  enviarEntregavel: (idTarefa: number, idUsuario: number, arquivoNome: string, tipo: string) => void;
  adicionarAnotacao: (a: Omit<Anotacao, "id_anotacao" | "data_registro">) => void;
  dispararLembreteManual: (idTarefa: number) => void;
  registrarCadastroInicial: (input: NovoCadastroInput) => { usuario: Usuario; equipe: Equipe };
  criarUsuarioAdminOuMentor: (u: Omit<Usuario, "id_usuario" | "senha"> & { senha?: string }) => void;
  atualizarLinkPitch: (idEquipe: number, link: string) => void;
  adicionarMentor: (idEquipe: number, idUsuario: number) => void;
  removerMentor: (idEquipe: number, idUsuario: number) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

let nextIds = {
  usuario: 1000,
  equipe: 1000,
  equipeUsuario: 1000,
  tarefa: 1000,
  entregavel: 1000,
  anotacao: 1000,
  lembrete: 1000,
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [cursos] = useState<Curso[]>(seedCursos);
  const [etapas] = useState<Etapa[]>(seedEtapas);
  const [statusTarefa] = useState<StatusTarefa[]>(seedStatusTarefa);
  const [usuarios, setUsuarios] = useState<Usuario[]>(seedUsuarios);
  const [equipes, setEquipes] = useState<Equipe[]>(seedEquipes);
  const [equipeUsuarios, setEquipeUsuarios] = useState<EquipeUsuario[]>(seedEquipeUsuarios);
  const [tarefas, setTarefas] = useState<Tarefa[]>(seedTarefas);
  const [entregaveis, setEntregaveis] = useState<Entregavel[]>(seedEntregaveis);
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>(seedAnotacoes);
  const [lembretes, setLembretes] = useState<Lembrete[]>(seedLembretes);
  const [equipeMentores, setEquipeMentores] = useState<EquipeMentor[]>(seedEquipeMentores);

  function avancarEtapa(idEquipe: number, delta: 1 | -1) {
    setEquipes((prev) =>
      prev.map((eq) => {
        if (eq.id_equipe !== idEquipe) return eq;
        const proxima = Math.min(6, Math.max(1, eq.id_etapa_atual + delta));
        return {
          ...eq,
          id_etapa_atual: proxima,
          pronto_para_inovamf: proxima === 6 ? eq.pronto_para_inovamf : false,
        };
      })
    );
  }

  function criarTarefa(t: Omit<Tarefa, "id_tarefa" | "id_status"> & { id_status?: number }) {
    const id_tarefa = nextIds.tarefa++;
    setTarefas((prev) => [
      ...prev,
      { ...t, id_tarefa, id_status: t.id_status ?? 1 },
    ]);
  }

  function atualizarStatusTarefa(idTarefa: number, idStatus: number) {
    setTarefas((prev) => prev.map((t) => (t.id_tarefa === idTarefa ? { ...t, id_status: idStatus } : t)));
  }

  // Esclarecido com o cliente: apenas o mentor pode alterar o prazo de uma tarefa já criada.
  // A checagem de perfil acontece na tela (AdminEquipeDetalhePage); esta função só aplica a mudança.
  function atualizarPrazoTarefa(idTarefa: number, novaData: string) {
    setTarefas((prev) => prev.map((t) => (t.id_tarefa === idTarefa ? { ...t, data_limite: novaData } : t)));
  }

  function enviarEntregavel(idTarefa: number, idUsuario: number, arquivoNome: string, tipo: string) {
    const id_entregavel = nextIds.entregavel++;
    setEntregaveis((prev) => [
      ...prev,
      {
        id_entregavel,
        arquivo_url: `/mock-files/${arquivoNome}`,
        tipo,
        data_envio: new Date().toISOString(),
        id_tarefa: idTarefa,
        id_usuario: idUsuario,
      },
    ]);
    atualizarStatusTarefa(idTarefa, 3); // Entregue
  }

  function adicionarAnotacao(a: Omit<Anotacao, "id_anotacao" | "data_registro">) {
    const id_anotacao = nextIds.anotacao++;
    setAnotacoes((prev) => [
      { ...a, id_anotacao, data_registro: new Date().toISOString() },
      ...prev,
    ]);
  }

  function dispararLembreteManual(idTarefa: number) {
    const id_lembrete = nextIds.lembrete++;
    setLembretes((prev) => [
      ...prev,
      {
        id_lembrete,
        data_programada: new Date().toISOString().slice(0, 10),
        enviado: true,
        id_tarefa: idTarefa,
      },
    ]);
  }

  function criarUsuarioAdminOuMentor(u: Omit<Usuario, "id_usuario" | "senha"> & { senha?: string }) {
    const id_usuario = nextIds.usuario++;
    setUsuarios((prev) => [
      ...prev,
      { ...u, id_usuario, senha: u.senha ?? "trocar123" },
    ]);
  }

  function atualizarLinkPitch(idEquipe: number, link: string) {
    setEquipes((prev) => prev.map((eq) => (eq.id_equipe === idEquipe ? { ...eq, link_pitch: link } : eq)));
  }

  function adicionarMentor(idEquipe: number, idUsuario: number) {
    setEquipeMentores((prev) => {
      const jaExiste = prev.some((em) => em.id_equipe === idEquipe && em.id_usuario === idUsuario);
      if (jaExiste) return prev;
      return [...prev, { id_equipe: idEquipe, id_usuario: idUsuario }];
    });
    // mantém id_mentor (schema atual) apontando para o primeiro mentor, para compatibilidade
    setEquipes((prev) =>
      prev.map((eq) => (eq.id_equipe === idEquipe && eq.id_mentor == null ? { ...eq, id_mentor: idUsuario } : eq))
    );
  }

  function removerMentor(idEquipe: number, idUsuario: number) {
    setEquipeMentores((prev) => prev.filter((em) => !(em.id_equipe === idEquipe && em.id_usuario === idUsuario)));
    setEquipes((prev) =>
      prev.map((eq) => (eq.id_equipe === idEquipe && eq.id_mentor === idUsuario ? { ...eq, id_mentor: null } : eq))
    );
  }

  function registrarCadastroInicial(input: NovoCadastroInput) {
    const id_usuario = nextIds.usuario++;
    const lider: Usuario = {
      id_usuario,
      nome: input.nomeLider,
      telefone: input.telefone,
      email: input.email,
      senha: input.senha,
      perfil: "aluno",
      id_curso: input.idCurso,
      semestre: input.semestre,
    };

    // Esclarecido com o cliente: não é preciso RA, só e-mail e curso do colega.
    // Se o e-mail já pertence a um aluno cadastrado, ele é automaticamente
    // adicionado à nova equipe (sem precisar aceitar convite); senão, a conta
    // dele já é criada agora (com senha provisória) para que também possa
    // logar depois.
    const colegasUsuarios: Usuario[] = [];
    const idsColegas: number[] = [];

    setUsuarios((prevUsuarios) => {
      const usuariosAtualizados = [...prevUsuarios, lider];
      for (const colega of input.colegas) {
        if (!colega.email.trim()) continue;
        const existente = usuariosAtualizados.find(
          (u) => u.email.toLowerCase() === colega.email.trim().toLowerCase()
        );
        if (existente) {
          idsColegas.push(existente.id_usuario);
          continue;
        }
        const novoColega: Usuario = {
          id_usuario: nextIds.usuario++,
          nome: colega.nome.trim() || colega.email.split("@")[0],
          telefone: "",
          email: colega.email.trim(),
          senha: "trocar123",
          perfil: "aluno",
          id_curso: colega.idCurso,
          semestre: null,
        };
        colegasUsuarios.push(novoColega);
        idsColegas.push(novoColega.id_usuario);
        usuariosAtualizados.push(novoColega);
      }
      return usuariosAtualizados;
    });

    const id_equipe = nextIds.equipe++;
    const novaEquipe: Equipe = {
      id_equipe,
      nome_equipe: input.nomeEquipe,
      nome_ideia: input.nomeIdeia,
      descricao_ideia: input.descricaoIdeia,
      area_ideia: input.areaIdeia,
      estagio_ideia: input.estagioIdeia,
      como_conheceu: input.comoConheceu,
      link_pitch: null,
      id_mentor: null,
      id_etapa_atual: 1,
    };

    const novosVinculos: EquipeUsuario[] = [
      { id_equipe_usuario: nextIds.equipeUsuario++, id_equipe, id_usuario, papel: "lider" },
      ...idsColegas.map((idColega) => ({
        id_equipe_usuario: nextIds.equipeUsuario++,
        id_equipe,
        id_usuario: idColega,
        papel: "integrante" as const,
      })),
    ];

    setEquipes((prev) => [...prev, novaEquipe]);
    setEquipeUsuarios((prev) => [...prev, ...novosVinculos]);

    return { usuario: lider, equipe: novaEquipe };
  }

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
      avancarEtapa,
      criarTarefa,
      atualizarStatusTarefa,
      atualizarPrazoTarefa,
      enviarEntregavel,
      adicionarAnotacao,
      dispararLembreteManual,
      registrarCadastroInicial,
      criarUsuarioAdminOuMentor,
      atualizarLinkPitch,
      adicionarMentor,
      removerMentor,
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
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData deve ser usado dentro de DataProvider");
  return ctx;
}
