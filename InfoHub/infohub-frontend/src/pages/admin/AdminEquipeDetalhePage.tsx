import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  Link2,
  Lock,
  Mail,
  Pencil,
  Phone,
  Plus,
  Send,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";
import { useData } from "../../store/DataContext";
import { useAuth } from "../../store/AuthContext";
import { Card, PrimaryButton, SecondaryButton, Pill, EmptyState } from "../../components/Kit";
import { StageRail } from "../../components/StageRail";
import { StatusBadge } from "../../components/StatusBadge";
import {
  getCursoNome,
  getEquipeMembros,
  getMentoresDaEquipe,
  getStatusDescricao,
  formatarData,
  formatarDataHora,
  diasParaPrazo,
  isPrazoVencido,
} from "../../utils/selectors";

export function AdminEquipeDetalhePage() {
  const { id } = useParams();
  const idEquipe = Number(id);
  const navigate = useNavigate();
  const { usuarioAtual } = useAuth();
  const {
    equipes,
    etapas,
    usuarios,
    equipeUsuarios,
    cursos,
    tarefas,
    statusTarefa,
    entregaveis,
    anotacoes,
    equipeMentores,
    avancarEtapa,
    criarTarefa,
    atualizarStatusTarefa,
    atualizarPrazoTarefa,
    adicionarAnotacao,
    dispararLembreteManual,
    adicionarMentor,
    removerMentor,
    criarEtapaExtra,
  } = useData();

  const equipe = equipes.find((e) => e.id_equipe === idEquipe);
  const [novaNota, setNovaNota] = useState("");
  const [mostrarNovaTarefa, setMostrarNovaTarefa] = useState(false);
  const [tituloTarefa, setTituloTarefa] = useState("");
  const [descTarefa, setDescTarefa] = useState("");
  const [prazoTarefa, setPrazoTarefa] = useState("");
  const [etapaTarefa, setEtapaTarefa] = useState(equipe?.id_etapa_atual ?? 1);
  const [tarefaEditandoPrazo, setTarefaEditandoPrazo] = useState<number | null>(null);
  const [novoMentorId, setNovoMentorId] = useState<number | "">("");
  const [mostrarNovaEtapa, setMostrarNovaEtapa] = useState(false);
  const [nomeEtapa, setNomeEtapa] = useState("");
  const [descEtapa, setDescEtapa] = useState("");

  // só o admin atribui/remove mentores (a API também exige isso)
  const ehAdmin = usuarioAtual?.perfil === "admin";

  const membros = useMemo(
    () => (equipe ? getEquipeMembros(equipeUsuarios, usuarios, equipe.id_equipe) : []),
    [equipe, equipeUsuarios, usuarios]
  );
  const mentoresEquipe = equipe ? getMentoresDaEquipe(equipeMentores, usuarios, equipe.id_equipe) : [];
  const mentoresDisponiveis = usuarios.filter(
    (u) => u.perfil === "mentor" && !mentoresEquipe.some((m) => m.id_usuario === u.id_usuario)
  );
  const tarefasEquipe = tarefas.filter((t) => t.id_equipe === idEquipe).sort((a, b) => a.data_limite.localeCompare(b.data_limite));
  const anotacoesEquipe = anotacoes.filter((a) => a.id_equipe === idEquipe);
  // Jornada DESTA equipe (etapa é por-equipe agora — ver decisão 7 do backend).
  const etapasEquipe = useMemo(
    () => etapas.filter((e) => e.id_equipe === idEquipe).sort((a, b) => a.ordem - b.ordem),
    [etapas, idEquipe]
  );
  // Decisão do InfoHub (WhatsApp): só o mentor DESTA equipe pode acrescentar
  // etapa extra — não basta ser mentor em geral, tem que estar
  // na lista de mentores desta equipe especificamente.
  const souMentorDestaEquipe = mentoresEquipe.some((m) => m.id_usuario === usuarioAtual?.id_usuario);
  // Requisito (seção 2): admin define prazos; mentor também, nas equipes dele.
  const podeAlterarPrazo = ehAdmin || souMentorDestaEquipe;

  if (!equipe) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <EmptyState title="Equipe não encontrada" description="Verifique o link ou volte para o funil." />
        <Link to="/admin/equipes" className="text-accent-orange text-sm font-medium mt-4 inline-block">
          ← Voltar ao funil
        </Link>
      </div>
    );
  }

  function handleCriarTarefa(e: React.FormEvent) {
    e.preventDefault();
    if (!tituloTarefa || !prazoTarefa) return;
    criarTarefa({
      titulo: tituloTarefa,
      descricao: descTarefa || "Sem instruções adicionais.",
      data_limite: prazoTarefa,
      id_equipe: idEquipe,
      id_etapa: etapaTarefa,
    });
    setTituloTarefa("");
    setDescTarefa("");
    setPrazoTarefa("");
    setMostrarNovaTarefa(false);
  }

  function handleAdicionarNota(e: React.FormEvent) {
    e.preventDefault();
    if (!novaNota.trim() || !usuarioAtual) return;
    adicionarAnotacao({
      descricao: novaNota,
      id_usuario: usuarioAtual.id_usuario,
      id_equipe: idEquipe,
      id_etapa: equipe?.id_etapa_atual ?? 1,
    });
    setNovaNota("");
  }

  function handleCriarEtapaExtra(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeEtapa.trim()) return;
    criarEtapaExtra(idEquipe, nomeEtapa.trim(), descEtapa.trim() || "Etapa extra combinada com o mentor.");
    setNomeEtapa("");
    setDescEtapa("");
    setMostrarNovaEtapa(false);
  }

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-text-soft hover:text-ink flex items-center gap-1.5 mb-4"
      >
        <ArrowLeft size={15} /> Voltar
      </button>

      <Card className="p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl font-semibold text-ink">{equipe.nome_equipe}</h1>
              {equipe.pronto_para_inovamf && (
                <Pill className="bg-brand-success-soft text-brand-success">
                  <Sparkles size={12} /> Pronta para o InovAMF
                </Pill>
              )}
            </div>
            <p className="text-text-soft text-sm mt-1 max-w-xl">{equipe.nome_ideia}</p>
          </div>
          <div className="flex gap-2">
            <Pill>{equipe.area_ideia}</Pill>
            <Pill>{equipe.estagio_ideia}</Pill>
          </div>
        </div>

        <p className="text-sm text-text-soft mt-4 leading-relaxed max-w-2xl">{equipe.descricao_ideia}</p>

        {equipe.link_pitch && (
          <a
            href={equipe.link_pitch}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-accent-orange font-medium mt-3 hover:underline"
          >
            <Link2 size={14} /> Ver pitch vídeo
          </a>
        )}

        <div className="mt-7 pt-6 border-t border-paper-line">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-soft">
              Etapa atual: <span className="text-ink">{equipe.etapa_atual_nome}</span>
              {!equipe.etapa_atual_padrao && (
                <span className="ml-1.5 text-accent-orange normal-case font-normal">(etapa extra)</span>
              )}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => avancarEtapa(idEquipe, -1)}
                disabled={equipe.etapa_atual_ordem === 1}
                className="p-1.5 rounded-lg border border-paper-line disabled:opacity-30 hover:bg-paper-alt transition"
                title="Retroceder etapa (RF-09)"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => avancarEtapa(idEquipe, 1)}
                disabled={equipe.etapa_atual_ordem === equipe.total_etapas}
                className="p-1.5 rounded-lg border border-paper-line disabled:opacity-30 hover:bg-paper-alt transition"
                title="Avançar etapa (RF-09)"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <StageRail etapas={etapasEquipe} ordemAtual={equipe.etapa_atual_ordem} pronto={equipe.pronto_para_inovamf} />

          {/* Decisão do InfoHub (WhatsApp): a jornada padrão segue com 6 etapas,
              mas o mentor DESTA equipe pode acrescentar etapas extras. */}
          {souMentorDestaEquipe && (
            <div className="mt-4 pt-4 border-t border-paper-line">
              {mostrarNovaEtapa ? (
                <form onSubmit={handleCriarEtapaExtra} className="space-y-2">
                  <input
                    className="w-full rounded-lg border border-paper-line px-3 py-2 text-sm"
                    placeholder="Nome da etapa extra (ex.: Follow-up pós-InovAMF)"
                    value={nomeEtapa}
                    onChange={(e) => setNomeEtapa(e.target.value)}
                    required
                  />
                  <textarea
                    className="w-full rounded-lg border border-paper-line px-3 py-2 text-sm min-h-[60px]"
                    placeholder="Do que se trata essa etapa?"
                    value={descEtapa}
                    onChange={(e) => setDescEtapa(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <PrimaryButton type="submit">
                      Adicionar como etapa {equipe.total_etapas + 1}
                    </PrimaryButton>
                    <SecondaryButton onClick={() => setMostrarNovaEtapa(false)}>Cancelar</SecondaryButton>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setMostrarNovaEtapa(true)}
                  className="text-xs font-semibold text-accent-orange flex items-center gap-1 hover:underline"
                >
                  <Plus size={14} /> Acrescentar etapa extra na jornada desta equipe
                </button>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-ink">Tarefas ({tarefasEquipe.length})</h2>
              <button
                onClick={() => setMostrarNovaTarefa((v) => !v)}
                className="text-xs font-semibold text-accent-orange flex items-center gap-1 hover:underline"
              >
                <Plus size={14} /> Nova tarefa
              </button>
            </div>

            {mostrarNovaTarefa && (
              <form onSubmit={handleCriarTarefa} className="mt-4 p-4 rounded-xl bg-paper-alt/60 space-y-3">
                <input
                  className="w-full rounded-lg border border-paper-line px-3 py-2 text-sm"
                  placeholder="Título da tarefa (ex.: Enviar Business Model Canvas)"
                  value={tituloTarefa}
                  onChange={(e) => setTituloTarefa(e.target.value)}
                  required
                />
                <textarea
                  className="w-full rounded-lg border border-paper-line px-3 py-2 text-sm min-h-[70px]"
                  placeholder="Instruções para o aluno"
                  value={descTarefa}
                  onChange={(e) => setDescTarefa(e.target.value)}
                />
                <div className="flex flex-wrap gap-3">
                  <label className="text-xs text-text-soft flex flex-col gap-1">
                    Prazo
                    <input
                      type="date"
                      className="rounded-lg border border-paper-line px-3 py-2 text-sm"
                      value={prazoTarefa}
                      onChange={(e) => setPrazoTarefa(e.target.value)}
                      required
                    />
                  </label>
                  <label className="text-xs text-text-soft flex flex-col gap-1">
                    Etapa relacionada
                    <select
                      className="rounded-lg border border-paper-line px-3 py-2 text-sm"
                      value={etapaTarefa}
                      onChange={(e) => setEtapaTarefa(Number(e.target.value))}
                    >
                      {etapasEquipe.map((et) => (
                        <option key={et.id_etapa} value={et.id_etapa}>
                          {et.ordem}. {et.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex gap-2">
                  <PrimaryButton type="submit">Criar tarefa</PrimaryButton>
                  <SecondaryButton onClick={() => setMostrarNovaTarefa(false)}>Cancelar</SecondaryButton>
                </div>
              </form>
            )}

            <div className="mt-4 space-y-3">
              {tarefasEquipe.length === 0 && (
                <p className="text-sm text-text-faint italic">Nenhuma tarefa atribuída ainda.</p>
              )}
              {tarefasEquipe.map((t) => {
                const status = getStatusDescricao(statusTarefa, t.id_status);
                const arquivos = entregaveis.filter((e) => e.id_tarefa === t.id_tarefa);
                const atrasada = status !== "Aprovada" && isPrazoVencido(t.data_limite);
                const dias = diasParaPrazo(t.data_limite);
                const editandoPrazo = tarefaEditandoPrazo === t.id_tarefa;
                return (
                  <div key={t.id_tarefa} className="rounded-xl border border-paper-line p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold text-ink">{t.titulo}</p>
                        <p className="text-xs text-text-soft mt-0.5">{t.descricao}</p>
                      </div>
                      <StatusBadge status={atrasada ? "Atrasada" : status} />
                    </div>
                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                      {editandoPrazo ? (
                        <form
                          className="flex items-center gap-1.5"
                          onSubmit={(e) => {
                            e.preventDefault();
                            setTarefaEditandoPrazo(null);
                          }}
                        >
                          <input
                            type="date"
                            autoFocus
                            defaultValue={t.data_limite}
                            className="rounded-lg border border-paper-line px-2 py-1 text-xs font-mono"
                            onChange={(e) => atualizarPrazoTarefa(t.id_tarefa, e.target.value)}
                          />
                          <button
                            type="submit"
                            className="text-[11px] font-semibold text-brand-success hover:underline"
                          >
                            OK
                          </button>
                        </form>
                      ) : (
                        <span className="text-[11px] font-mono text-text-faint flex items-center gap-1.5">
                          prazo {formatarData(t.data_limite)}
                          {!atrasada && status !== "Aprovada" && (
                            <span className="ml-0.5">
                              ({dias >= 0 ? `${dias}d restantes` : `${Math.abs(dias)}d atraso`})
                            </span>
                          )}
                          {podeAlterarPrazo ? (
                            <button
                              onClick={() => setTarefaEditandoPrazo(t.id_tarefa)}
                              className="text-text-faint hover:text-accent-orange transition"
                              title="Alterar prazo"
                            >
                              <Pencil size={11} />
                            </button>
                          ) : (
                            <span title="Só o admin ou um mentor desta equipe pode alterar o prazo">
                              <Lock size={10} className="text-text-faint" />
                            </span>
                          )}
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => dispararLembreteManual(t.id_tarefa)}
                          className="text-[11px] font-medium text-brand-info flex items-center gap-1 hover:underline"
                          title="Disparar lembrete manual (RF-20)"
                        >
                          <Send size={11} /> lembrete
                        </button>
                        {status === "Entregue" && (
                          <>
                            <button
                              onClick={() => atualizarStatusTarefa(t.id_tarefa, 5)}
                              className="text-[11px] font-semibold text-brand-success hover:underline"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => atualizarStatusTarefa(t.id_tarefa, 6)}
                              className="text-[11px] font-semibold text-brand-danger hover:underline"
                            >
                              Pedir ajuste
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {arquivos.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-paper-line space-y-1.5">
                        {arquivos.map((a) => {
                          const autor = usuarios.find((u) => u.id_usuario === a.id_usuario);
                          return (
                            <div key={a.id_entregavel} className="flex items-center gap-2 text-xs text-text-soft">
                              <FileText size={13} className="text-text-faint shrink-0" />
                              <span className="font-mono truncate">{a.arquivo_url.split("/").pop()}</span>
                              <span className="text-text-faint">
                                · {autor?.nome.split(" ")[0]} · {formatarDataHora(a.data_envio)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display font-semibold text-ink">Anotações internas (não visíveis ao aluno)</h2>
            <form onSubmit={handleAdicionarNota} className="mt-4 flex gap-2">
              <input
                className="flex-1 rounded-xl border border-paper-line px-3.5 py-2.5 text-sm"
                placeholder="Registrar observação da mentoria…"
                value={novaNota}
                onChange={(e) => setNovaNota(e.target.value)}
              />
              <PrimaryButton type="submit">Salvar</PrimaryButton>
            </form>
            <div className="mt-4 space-y-3">
              {anotacoesEquipe.length === 0 && (
                <p className="text-sm text-text-faint italic">Nenhuma anotação registrada ainda.</p>
              )}
              {anotacoesEquipe.map((a) => {
                const autor = usuarios.find((u) => u.id_usuario === a.id_usuario);
                return (
                  <div key={a.id_anotacao} className="rounded-xl bg-paper-alt/60 p-3.5">
                    <p className="text-sm text-ink">{a.descricao}</p>
                    <p className="text-[11px] text-text-faint mt-1.5">
                      {autor?.nome} · {formatarDataHora(a.data_registro)}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-ink text-sm">
                Mentores {mentoresEquipe.length > 0 && `(${mentoresEquipe.length})`}
              </h2>
            </div>
            <p className="text-[11px] text-text-faint mt-1">Uma equipe pode ter mais de um mentor.</p>
            <div className="mt-3 space-y-3">
              {mentoresEquipe.length === 0 && (
                <p className="text-sm text-text-faint italic">Nenhum mentor atribuído ainda.</p>
              )}
              {mentoresEquipe.map((mentor) => (
                <div key={mentor.id_usuario} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-ink">{mentor.nome}</p>
                    <p className="text-xs text-text-soft mt-0.5 flex items-center gap-1.5">
                      <Mail size={12} /> {mentor.email}
                    </p>
                  </div>
                  {ehAdmin && (
                  <button
                    onClick={() => removerMentor(idEquipe, mentor.id_usuario)}
                    className="p-1 rounded-md text-text-faint hover:text-brand-danger hover:bg-brand-danger-soft transition shrink-0"
                    title="Remover mentor desta equipe"
                  >
                    <X size={13} />
                  </button>
                  )}
                </div>
              ))}
            </div>
            {ehAdmin && mentoresDisponiveis.length > 0 && (
              <form
                className="mt-4 pt-4 border-t border-paper-line flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (novoMentorId === "") return;
                  adicionarMentor(idEquipe, Number(novoMentorId));
                  setNovoMentorId("");
                }}
              >
                <select
                  className="flex-1 min-w-0 rounded-lg border border-paper-line px-2.5 py-2 text-xs"
                  value={novoMentorId}
                  onChange={(e) => setNovoMentorId(e.target.value === "" ? "" : Number(e.target.value))}
                >
                  <option value="">Adicionar mentor…</option>
                  {mentoresDisponiveis.map((m) => (
                    <option key={m.id_usuario} value={m.id_usuario}>
                      {m.nome}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={novoMentorId === ""}
                  className="p-2 rounded-lg gradient-brand text-white disabled:opacity-40 shrink-0"
                  title="Adicionar mentor"
                >
                  <UserPlus size={14} />
                </button>
              </form>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-display font-semibold text-ink text-sm">Integrantes ({membros.length})</h2>
            <div className="mt-3 space-y-3">
              {membros.map(({ usuario, papel }) => (
                <div key={usuario.id_usuario} className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">{usuario.nome}</p>
                    <p className="text-xs text-text-soft">{getCursoNome(cursos, usuario.id_curso)}</p>
                    {usuario.email && (
                      <p className="text-[11px] text-text-faint flex items-center gap-1 mt-0.5">
                        <Mail size={10} /> {usuario.email}
                      </p>
                    )}
                    {usuario.telefone && (
                      <p className="text-[11px] text-text-faint flex items-center gap-1">
                        <Phone size={10} /> {usuario.telefone}
                      </p>
                    )}
                  </div>
                  <Pill className={papel === "lider" ? "bg-accent-orange/10 text-accent-orange" : ""}>
                    {papel === "lider" ? "Líder" : "Integrante"}
                  </Pill>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display font-semibold text-ink text-sm">Como conheceu</h2>
            <p className="text-sm text-text-soft mt-2">{equipe.como_conheceu ?? "Não informado"}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
