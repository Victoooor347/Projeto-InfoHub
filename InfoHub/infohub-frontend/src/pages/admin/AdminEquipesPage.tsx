import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, User } from "lucide-react";
import { useData } from "../../store/DataContext";
import { Card } from "../../components/Kit";
import {
  getCursoNome,
  getLiderEquipe,
  getMentoresDaEquipe,
  getTarefasDaEquipe,
  getStatusDescricao,
  isPrazoVencido,
} from "../../utils/selectors";
import type { AreaIdeia } from "../../types";

export function AdminEquipesPage() {
  const { equipes, etapas, usuarios, equipeUsuarios, cursos, tarefas, statusTarefa, equipeMentores } = useData();

  const [busca, setBusca] = useState("");
  const [area, setArea] = useState<AreaIdeia | "todas">("todas");
  const [mentorFiltro, setMentorFiltro] = useState<number | "todos">("todos");

  const mentores = usuarios.filter((u) => u.perfil === "mentor");
  const areas: AreaIdeia[] = ["Saúde", "Educação", "Meio Ambiente", "Tecnologia", "Entretenimento", "Serviços", "Outro"];

  const equipesFiltradas = useMemo(() => {
    return equipes.filter((eq) => {
      const buscaOk =
        busca.trim() === "" ||
        eq.nome_equipe.toLowerCase().includes(busca.toLowerCase()) ||
        eq.nome_ideia.toLowerCase().includes(busca.toLowerCase());
      const areaOk = area === "todas" || eq.area_ideia === area;
      const mentorOk =
        mentorFiltro === "todos" ||
        equipeMentores.some((em) => em.id_equipe === eq.id_equipe && em.id_usuario === mentorFiltro);
      return buscaOk && areaOk && mentorOk;
    });
  }, [equipes, busca, area, mentorFiltro, equipeMentores]);

  return (
    <div className="p-6 sm:p-8 max-w-[1400px] mx-auto">
      <p className="font-mono text-xs text-accent-orange font-medium tracking-wide">FUNIL DE EQUIPES</p>
      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink mt-1">Kanban da jornada</h1>
      <p className="text-text-soft text-sm mt-1">Arraste o olhar pelas seis etapas — clique numa equipe para ver os detalhes.</p>

      <div className="flex flex-wrap gap-3 mt-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por equipe ou ideia…"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-paper-line text-sm focus:outline-none focus:ring-2 focus:ring-accent-orange/40 focus:border-accent-orange bg-white"
          />
        </div>
        <select
          value={area}
          onChange={(e) => setArea(e.target.value as AreaIdeia | "todas")}
          className="px-3.5 py-2.5 rounded-xl border border-paper-line text-sm bg-white"
        >
          <option value="todas">Todas as áreas</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={mentorFiltro}
          onChange={(e) => setMentorFiltro(e.target.value === "todos" ? "todos" : Number(e.target.value))}
          className="px-3.5 py-2.5 rounded-xl border border-paper-line text-sm bg-white"
        >
          <option value="todos">Todos os mentores</option>
          {mentores.map((m) => (
            <option key={m.id_usuario} value={m.id_usuario}>
              {m.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="rail-scroll flex gap-4 mt-6 overflow-x-auto pb-4">
        {etapas.map((etapa) => {
          const equipesEtapa = equipesFiltradas.filter((eq) => eq.id_etapa_atual === etapa.id_etapa);
          return (
            <div key={etapa.id_etapa} className="w-72 shrink-0">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="w-6 h-6 rounded-full gradient-brand text-white text-xs font-mono font-semibold flex items-center justify-center shrink-0">
                  {etapa.id_etapa}
                </span>
                <h3 className="text-sm font-semibold text-ink leading-tight">{etapa.nome}</h3>
              </div>
              <div className="space-y-3">
                {equipesEtapa.map((eq) => {
                  const lider = getLiderEquipe(equipeUsuarios, usuarios, eq.id_equipe);
                  const mentoresEquipe = getMentoresDaEquipe(equipeMentores, usuarios, eq.id_equipe);
                  const tarefasEquipe = getTarefasDaEquipe(tarefas, eq.id_equipe);
                  const atrasadas = tarefasEquipe.filter(
                    (t) =>
                      getStatusDescricao(statusTarefa, t.id_status) !== "Aprovada" && isPrazoVencido(t.data_limite)
                  ).length;
                  return (
                    <Link key={eq.id_equipe} to={`/admin/equipes/${eq.id_equipe}`}>
                      <Card className="p-4 hover:border-accent-orange/50 hover:shadow-md transition cursor-pointer">
                        <p className="text-sm font-semibold text-ink leading-tight">{eq.nome_equipe}</p>
                        <p className="text-xs text-text-soft mt-0.5 line-clamp-2">{eq.nome_ideia}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-paper-alt text-ink-soft">
                            {eq.area_ideia}
                          </span>
                          {atrasadas > 0 && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-danger-soft text-brand-danger font-medium">
                              {atrasadas} atrasada{atrasadas > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-paper-line">
                          <span className="text-[11px] text-text-faint flex items-center gap-1">
                            <User size={11} /> {lider ? lider.nome.split(" ")[0] : "—"} ·{" "}
                            {getCursoNome(cursos, lider?.id_curso ?? null)}
                          </span>
                          <span className="text-[11px] text-text-faint">
                            {mentoresEquipe.length > 0
                              ? mentoresEquipe.map((m) => m.nome.split(" ")[0]).join(", ")
                              : "sem mentor"}
                          </span>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
                {equipesEtapa.length === 0 && (
                  <p className="text-xs text-text-faint italic px-1">Nenhuma equipe aqui.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
