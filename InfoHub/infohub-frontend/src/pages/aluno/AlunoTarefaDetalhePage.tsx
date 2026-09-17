import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, FileText, Link2, Lock, Upload } from "lucide-react";
import { useAuth } from "../../store/AuthContext";
import { useData } from "../../store/DataContext";
import { Card, EmptyState, PrimaryButton } from "../../components/Kit";
import { StatusBadge } from "../../components/StatusBadge";
import {
  formatarData,
  formatarDataHora,
  getLiderEquipe,
  getPapelDoUsuarioNaEquipe,
  getStatusDescricao,
  isPrazoVencido,
} from "../../utils/selectors";

export function AlunoTarefaDetalhePage() {
  const { id } = useParams();
  const idTarefa = Number(id);
  const navigate = useNavigate();
  const { usuarioAtual } = useAuth();
  const { tarefas, statusTarefa, equipes, etapas, entregaveis, enviarEntregavel, usuarios, equipeUsuarios } =
    useData();

  const tarefa = tarefas.find((t) => t.id_tarefa === idTarefa);
  const [linkExterno, setLinkExterno] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!tarefa) {
    return (
      <div>
        <EmptyState title="Tarefa não encontrada" description="Ela pode ter sido removida." />
        <Link to="/aluno/tarefas" className="text-accent-orange text-sm font-medium mt-4 inline-block">
          ← Voltar às tarefas
        </Link>
      </div>
    );
  }

  const equipe = equipes.find((eq) => eq.id_equipe === tarefa.id_equipe);
  const etapa = etapas.find((e) => e.id_etapa === tarefa.id_etapa);
  const statusBase = getStatusDescricao(statusTarefa, tarefa.id_status);
  const status = statusBase !== "Aprovada" && isPrazoVencido(tarefa.data_limite) ? "Atrasada" : statusBase;
  const historico = entregaveis
    .filter((e) => e.id_tarefa === idTarefa)
    .sort((a, b) => b.data_envio.localeCompare(a.data_envio));

  // Esclarecido com o cliente: líder e integrante têm regras diferentes.
  // Só o líder da equipe pode enviar entregáveis; o integrante acompanha em modo leitura.
  const papel = usuarioAtual ? getPapelDoUsuarioNaEquipe(equipeUsuarios, usuarioAtual.id_usuario, tarefa.id_equipe) : undefined;
  const podeEnviar = papel === "lider";
  const lider = equipe ? getLiderEquipe(equipeUsuarios, usuarios, equipe.id_equipe) : undefined;

  // Nesta v1 o backend guarda só a referência do arquivo (nome ou link) — não
  // há upload binário ainda, então mandamos o nome do arquivo escolhido.
  async function handleUploadArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !usuarioAtual) return;
    setEnviando(true);
    await enviarEntregavel(idTarefa, usuarioAtual.id_usuario, file.name, file.type || "arquivo");
    setEnviando(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleEnviarLink(e: React.FormEvent) {
    e.preventDefault();
    if (!linkExterno.trim() || !usuarioAtual) return;
    setEnviando(true);
    await enviarEntregavel(idTarefa, usuarioAtual.id_usuario, linkExterno.trim(), "link");
    setLinkExterno("");
    setEnviando(false);
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="text-sm text-text-soft hover:text-ink flex items-center gap-1.5 mb-4">
        <ArrowLeft size={15} /> Voltar
      </button>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs text-text-soft">
              {equipe?.nome_equipe} · Etapa {etapa?.id_etapa} — {etapa?.nome}
            </p>
            <h1 className="font-display text-xl sm:text-2xl font-semibold text-ink mt-1">{tarefa.titulo}</h1>
          </div>
          <StatusBadge status={status} />
        </div>

        <p className="text-sm text-text-soft mt-4 leading-relaxed">{tarefa.descricao}</p>
        <p className="text-xs font-mono text-text-faint mt-3">Prazo: {formatarData(tarefa.data_limite)}</p>

        {status === "Aprovada" ? (
          <div className="mt-6 flex items-center gap-2 text-brand-success bg-brand-success-soft rounded-xl px-4 py-3 text-sm font-medium">
            <CheckCircle2 size={17} /> Entrega aprovada pelo administrador.
          </div>
        ) : podeEnviar ? (
          <div className="mt-6 pt-5 border-t border-paper-line space-y-4">
            <p className="text-sm font-semibold text-ink">Enviar entregável</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-paper-line px-4 py-6 text-center cursor-pointer hover:border-accent-orange/50 hover:bg-paper-alt/40 transition">
                <Upload size={20} className="text-text-faint" />
                <span className="text-xs text-text-soft">Anexar arquivo (PDF, imagem, vídeo)</span>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleUploadArquivo} />
              </label>
              <form onSubmit={handleEnviarLink} className="flex flex-col justify-center gap-2 rounded-xl border border-paper-line px-4 py-4">
                <span className="text-xs text-text-soft flex items-center gap-1.5">
                  <Link2 size={13} /> Ou enviar um link (ex.: YouTube)
                </span>
                <div className="flex gap-2">
                  <input
                    className="flex-1 min-w-0 rounded-lg border border-paper-line px-3 py-2 text-sm"
                    placeholder="https://youtube.com/…"
                    value={linkExterno}
                    onChange={(e) => setLinkExterno(e.target.value)}
                  />
                  <PrimaryButton type="submit" disabled={enviando} className="px-3">
                    Enviar
                  </PrimaryButton>
                </div>
              </form>
            </div>
            {enviando && <p className="text-xs text-text-faint">Enviando…</p>}
          </div>
        ) : (
          <div className="mt-6 pt-5 border-t border-paper-line">
            <div className="flex items-start gap-2.5 text-sm text-text-soft bg-paper-alt/60 rounded-xl px-4 py-3">
              <Lock size={16} className="shrink-0 mt-0.5 text-text-faint" />
              <span>
                Apenas o(a) líder da equipe pode enviar entregáveis desta tarefa.
                {lider && (
                  <>
                    {" "}
                    Fale com <strong className="text-ink">{lider.nome}</strong> para que ele(a) faça o envio.
                  </>
                )}
              </span>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 mt-5">
        <h2 className="font-display font-semibold text-ink text-sm">Histórico de envios</h2>
        <div className="mt-3 space-y-2.5">
          {historico.length === 0 && <p className="text-sm text-text-faint italic">Nenhum arquivo enviado ainda.</p>}
          {historico.map((h) => {
            const autor = usuarios.find((u) => u.id_usuario === h.id_usuario);
            return (
              <div key={h.id_entregavel} className="flex items-center gap-2.5 text-sm">
                <FileText size={15} className="text-text-faint shrink-0" />
                <span className="font-mono text-xs truncate flex-1">{h.arquivo_url.split("/").pop()}</span>
                <span className="text-xs text-text-faint shrink-0">
                  {autor?.nome.split(" ")[0]} · {formatarDataHora(h.data_envio)}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
