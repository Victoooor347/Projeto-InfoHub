import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../store/AuthContext";
import { useData } from "../../store/DataContext";
import { Card, EmptyState } from "../../components/Kit";
import { StatusBadge } from "../../components/StatusBadge";
import { formatarData, getEquipesDoUsuario, getStatusDescricao, isPrazoVencido } from "../../utils/selectors";
import type { StatusTarefaDescricao } from "../../types";

const filtros: { label: string; value: StatusTarefaDescricao | "todas" | "pendentes" }[] = [
  { label: "Pendentes", value: "pendentes" },
  { label: "Todas", value: "todas" },
  { label: "Atrasadas", value: "Atrasada" },
  { label: "Aprovadas", value: "Aprovada" },
];

export function AlunoTarefasPage() {
  const { usuarioAtual } = useAuth();
  const { equipes, equipeUsuarios, tarefas, statusTarefa, etapas } = useData();
  const [filtro, setFiltro] = useState<(typeof filtros)[number]["value"]>("pendentes");

  const idsEquipes = usuarioAtual ? getEquipesDoUsuario(equipeUsuarios, usuarioAtual.id_usuario) : [];

  const tarefasVisiveis = useMemo(() => {
    return tarefas
      .filter((t) => idsEquipes.includes(t.id_equipe))
      .map((t) => {
        const statusBase = getStatusDescricao(statusTarefa, t.id_status);
        const status: StatusTarefaDescricao =
          statusBase !== "Aprovada" && isPrazoVencido(t.data_limite) ? "Atrasada" : statusBase;
        const equipe = equipes.find((eq) => eq.id_equipe === t.id_equipe);
        const etapa = etapas.find((e) => e.id_etapa === t.id_etapa);
        return { ...t, status, equipe, etapa };
      })
      .filter((t) => {
        if (filtro === "todas") return true;
        if (filtro === "pendentes") return t.status !== "Aprovada";
        return t.status === filtro;
      })
      .sort((a, b) => a.data_limite.localeCompare(b.data_limite));
  }, [tarefas, idsEquipes, statusTarefa, equipes, etapas, filtro]);

  return (
    <div>
      <p className="font-mono text-xs text-accent-orange font-medium tracking-wide">TAREFAS</p>
      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink mt-1">Suas entregas</h1>
      <p className="text-text-soft text-sm mt-1">Prazos e instruções de cada etapa, num só lugar.</p>

      <div className="flex gap-2 mt-5 overflow-x-auto pb-1">
        {filtros.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
              filtro === f.value ? "bg-ink text-white" : "bg-white border border-paper-line text-text-soft hover:bg-paper-alt"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {tarefasVisiveis.length === 0 && (
          <EmptyState title="Nada por aqui" description="Não há tarefas para o filtro selecionado." />
        )}
        {tarefasVisiveis.map((t) => (
          <Link key={t.id_tarefa} to={`/aluno/tarefas/${t.id_tarefa}`}>
            <Card className="p-4 hover:border-accent-orange/40 transition">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{t.titulo}</p>
                  <p className="text-xs text-text-soft mt-0.5 truncate">
                    {t.equipe?.nome_equipe} · Etapa {t.etapa?.id_etapa}
                  </p>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <p className="text-[11px] font-mono text-text-faint mt-2.5">prazo {formatarData(t.data_limite)}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
