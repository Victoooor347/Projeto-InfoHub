import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useData } from "../../store/DataContext";
import { Card, Kpi, PrimaryButton } from "../../components/Kit";
import {
  getCursoNome,
  getLiderEquipe,
  getMentoresDaEquipe,
  getStatusDescricao,
  isPrazoVencido,
} from "../../utils/selectors";

export function AdminRelatoriosPage() {
  const { equipes, etapas, usuarios, equipeUsuarios, cursos, tarefas, statusTarefa, equipeMentores } = useData();
  const [cursoFiltro, setCursoFiltro] = useState<number | "todos">("todos");

  const linhas = useMemo(() => {
    return equipes
      .map((eq) => {
        const lider = getLiderEquipe(equipeUsuarios, usuarios, eq.id_equipe);
        const mentores = getMentoresDaEquipe(equipeMentores, usuarios, eq.id_equipe);
        const etapa = etapas.find((e) => e.id_etapa === eq.id_etapa_atual);
        const tarefasEquipe = tarefas.filter((t) => t.id_equipe === eq.id_equipe);
        const atrasadas = tarefasEquipe.filter(
          (t) => getStatusDescricao(statusTarefa, t.id_status) !== "Aprovada" && isPrazoVencido(t.data_limite)
        ).length;
        return { eq, lider, mentores, etapa, atrasadas };
      })
      .filter((r) => cursoFiltro === "todos" || r.lider?.id_curso === cursoFiltro);
  }, [equipes, equipeUsuarios, usuarios, etapas, tarefas, statusTarefa, cursoFiltro, equipeMentores]);

  function exportarCSV() {
    const header = [
      "Equipe",
      "Ideia",
      "Area",
      "Estagio",
      "Etapa atual",
      "Lider",
      "Curso do lider",
      "Mentor",
      "Tarefas atrasadas",
      "Pronta para InovAMF",
    ];
    const rows = linhas.map((r) =>
      [
        r.eq.nome_equipe,
        r.eq.nome_ideia,
        r.eq.area_ideia,
        r.eq.estagio_ideia,
        `${r.etapa?.id_etapa} - ${r.etapa?.nome}`,
        r.lider?.nome ?? "",
        getCursoNome(cursos, r.lider?.id_curso ?? null),
        r.mentores.length > 0 ? r.mentores.map((m) => m.nome).join(" / ") : "sem mentor",
        String(r.atrasadas),
        r.eq.pronto_para_inovamf ? "sim" : "não",
      ]
        .map((v) => `"${String(v).replaceAll('"', '""')}"`)
        .join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `infohub-equipes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-accent-orange font-medium tracking-wide">RELATÓRIOS</p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink mt-1">Visão para a coordenação</h1>
          <p className="text-text-soft text-sm mt-1">Consolidado do funil para reuniões e prestação de contas.</p>
        </div>
        <PrimaryButton onClick={exportarCSV} className="flex items-center gap-2">
          <Download size={15} /> Exportar CSV
        </PrimaryButton>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <Kpi label="Equipes no relatório" value={linhas.length} accent />
        <Kpi
          label="Com tarefas atrasadas"
          value={linhas.filter((r) => r.atrasadas > 0).length}
        />
        <Kpi label="Prontas para InovAMF" value={linhas.filter((r) => r.eq.pronto_para_inovamf).length} />
      </div>

      <div className="flex items-center gap-3 mt-6">
        <label className="text-xs text-text-soft font-medium">Filtrar por curso do líder:</label>
        <select
          value={cursoFiltro}
          onChange={(e) => setCursoFiltro(e.target.value === "todos" ? "todos" : Number(e.target.value))}
          className="px-3.5 py-2 rounded-xl border border-paper-line text-sm bg-white"
        >
          <option value="todos">Todos os cursos</option>
          {cursos.map((c) => (
            <option key={c.id_curso} value={c.id_curso}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      <Card className="mt-4 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-xs text-text-soft uppercase tracking-wide border-b border-paper-line">
              <th className="px-5 py-3 font-medium">Equipe</th>
              <th className="px-5 py-3 font-medium">Curso do líder</th>
              <th className="px-5 py-3 font-medium">Etapa</th>
              <th className="px-5 py-3 font-medium">Mentor</th>
              <th className="px-5 py-3 font-medium">Atrasadas</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((r) => (
              <tr key={r.eq.id_equipe} className="border-b border-paper-line last:border-0 hover:bg-paper-alt/40">
                <td className="px-5 py-3.5 font-medium text-ink">{r.eq.nome_equipe}</td>
                <td className="px-5 py-3.5 text-text-soft">{getCursoNome(cursos, r.lider?.id_curso ?? null)}</td>
                <td className="px-5 py-3.5 text-text-soft">
                  {r.etapa?.id_etapa}. {r.etapa?.nome.split(" – ")[0]}
                </td>
                <td className="px-5 py-3.5 text-text-soft">
                  {r.mentores.length > 0 ? r.mentores.map((m) => m.nome).join(", ") : "—"}
                </td>
                <td className="px-5 py-3.5">
                  {r.atrasadas > 0 ? (
                    <span className="text-brand-danger font-medium">{r.atrasadas}</span>
                  ) : (
                    <span className="text-text-faint">0</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  {r.eq.pronto_para_inovamf ? (
                    <span className="text-brand-success font-medium">Pronta p/ InovAMF</span>
                  ) : (
                    <span className="text-text-soft">Em andamento</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
