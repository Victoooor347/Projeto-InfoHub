import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useData } from "../../store/DataContext";
import { Card, EmptyState } from "../../components/Kit";
import { StatusBadge } from "../../components/StatusBadge";
import { formatarData, getStatusDescricao, isPrazoVencido } from "../../utils/selectors";
import type { StatusTarefaDescricao } from "../../types";

export function AdminTarefasPage() {
  const { tarefas, equipes, etapas, statusTarefa } = useData();
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<StatusTarefaDescricao | "todas">("todas");
  const [equipeFiltro, setEquipeFiltro] = useState<number | "todas">("todas");

  const tarefasEnriquecidas = useMemo(() => {
    return tarefas
      .map((t) => {
        const equipe = equipes.find((e) => e.id_equipe === t.id_equipe);
        const etapa = etapas.find((e) => e.id_etapa === t.id_etapa);
        const statusBase = getStatusDescricao(statusTarefa, t.id_status);
        const status: StatusTarefaDescricao =
          statusBase !== "Aprovada" && isPrazoVencido(t.data_limite) ? "Atrasada" : statusBase;
        return { ...t, equipe, etapa, status };
      })
      .filter((t) => {
        const buscaOk =
          busca.trim() === "" ||
          t.titulo.toLowerCase().includes(busca.toLowerCase()) ||
          t.equipe?.nome_equipe.toLowerCase().includes(busca.toLowerCase());
        const statusOk = statusFiltro === "todas" || t.status === statusFiltro;
        const equipeOk = equipeFiltro === "todas" || t.id_equipe === equipeFiltro;
        return buscaOk && statusOk && equipeOk;
      })
      .sort((a, b) => a.data_limite.localeCompare(b.data_limite));
  }, [tarefas, equipes, etapas, statusTarefa, busca, statusFiltro, equipeFiltro]);

  const statusOptions: StatusTarefaDescricao[] = [
    "Pendente",
    "Em andamento",
    "Entregue",
    "Atrasada",
    "Aprovada",
    "Reprovada/Ajustar",
  ];

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      <p className="font-mono text-xs text-accent-orange font-medium tracking-wide">TAREFAS</p>
      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink mt-1">Todas as tarefas</h1>
      <p className="text-text-soft text-sm mt-1">{tarefasEnriquecidas.length} tarefas encontradas com os filtros atuais.</p>

      <div className="flex flex-wrap gap-3 mt-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por tarefa ou equipe…"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-paper-line text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-orange/40 focus:border-accent-orange"
          />
        </div>
        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value as StatusTarefaDescricao | "todas")}
          className="px-3.5 py-2.5 rounded-xl border border-paper-line text-sm bg-white"
        >
          <option value="todas">Todos os status</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={equipeFiltro}
          onChange={(e) => setEquipeFiltro(e.target.value === "todas" ? "todas" : Number(e.target.value))}
          className="px-3.5 py-2.5 rounded-xl border border-paper-line text-sm bg-white"
        >
          <option value="todas">Todas as equipes</option>
          {equipes.map((eq) => (
            <option key={eq.id_equipe} value={eq.id_equipe}>
              {eq.nome_equipe}
            </option>
          ))}
        </select>
      </div>

      <Card className="mt-6 overflow-hidden">
        {tarefasEnriquecidas.length === 0 ? (
          <div className="p-6">
            <EmptyState title="Nenhuma tarefa encontrada" description="Ajuste os filtros para ver mais resultados." />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-soft uppercase tracking-wide border-b border-paper-line">
                <th className="px-5 py-3 font-medium">Tarefa</th>
                <th className="px-5 py-3 font-medium">Equipe</th>
                <th className="px-5 py-3 font-medium">Etapa</th>
                <th className="px-5 py-3 font-medium">Prazo</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {tarefasEnriquecidas.map((t) => (
                <tr key={t.id_tarefa} className="border-b border-paper-line last:border-0 hover:bg-paper-alt/40">
                  <td className="px-5 py-3.5">
                    <Link to={`/admin/equipes/${t.id_equipe}`} className="font-medium text-ink hover:text-accent-orange">
                      {t.titulo}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-text-soft">{t.equipe?.nome_equipe}</td>
                  <td className="px-5 py-3.5 text-text-soft">{t.etapa?.id_etapa}. {t.etapa?.nome.split(" – ")[0]}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-text-soft">{formatarData(t.data_limite)}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
