import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, User, Sparkles } from "lucide-react";
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
import type { AreaIdeia, Equipe } from "../../types";

// As 6 etapas padrão têm o mesmo nome pra toda equipe (nasceram da mesma
// cópia — ver ETAPAS_PADRAO no backend). Por isso dá pra usar esses nomes
// como cabeçalho fixo de coluna, mesmo sem uma tabela global de etapas.
const NOMES_ETAPAS_PADRAO = [
  "Envio da ideia",
  "Contato com a equipe",
  "Encontro 1 – Entendendo a ideia",
  "Encontro 2 – Proposta de valor",
  "Encontro 3 – Modelo de negócio",
  "Encontro 4 – Pitch e inscrição",
];
const ULTIMA_ORDEM_PADRAO = NOMES_ETAPAS_PADRAO.length; // 6

export function AdminEquipesPage() {
  const { equipes, usuarios, equipeUsuarios, cursos, tarefas, statusTarefa, equipeMentores } = useData();

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

  /**
   * Cada equipe tem sua própria jornada agora (o mentor pode acrescentar
   * etapas extras — decisão do InfoHub via WhatsApp), então não existe
   * mais "a etapa 3" compartilhada por todo mundo. O Kanban agrupa pela
   * POSIÇÃO (ordem) 1 a 6 — que tem o mesmo nome pra qualquer equipe,
   * porque todas nascem da mesma cópia padrão — e junta quem já passou
   * disso (ordem 7+, que diverge por equipe) numa coluna final única.
   */
  const colunas = useMemo(() => {
    const porOrdem = new Map<number, Equipe[]>();
    for (let o = 1; o <= ULTIMA_ORDEM_PADRAO; o++) porOrdem.set(o, []);
    const extras: Equipe[] = [];

    for (const eq of equipesFiltradas) {
      if (eq.etapa_atual_ordem <= ULTIMA_ORDEM_PADRAO) {
        porOrdem.get(eq.etapa_atual_ordem)?.push(eq);
      } else {
        extras.push(eq);
      }
    }

    return [
      ...NOMES_ETAPAS_PADRAO.map((nome, i) => ({
        chave: `padrao-${i + 1}`,
        titulo: nome,
        ordem: i + 1,
        extra: false,
        equipes: porOrdem.get(i + 1) ?? [],
      })),
      { chave: "extras", titulo: "Além da jornada padrão", ordem: null, extra: true, equipes: extras },
    ];
  }, [equipesFiltradas]);

  return (
    <div className="p-6 sm:p-8 max-w-[1400px] mx-auto">
      <p className="font-mono text-xs text-accent-orange font-medium tracking-wide">FUNIL DE EQUIPES</p>
      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink mt-1">Kanban da jornada</h1>
      <p className="text-text-soft text-sm mt-1">
        As 6 etapas padrão, mais uma coluna para quem já está em etapas extras criadas pelo mentor.
      </p>

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
        {colunas.map((coluna) => (
          <div key={coluna.chave} className="w-72 shrink-0">
            <div className="flex items-center gap-2 mb-3 px-1">
              <span
                className={
                  coluna.extra
                    ? "w-6 h-6 rounded-full bg-accent-orange/15 text-accent-orange text-xs font-mono font-semibold flex items-center justify-center shrink-0"
                    : "w-6 h-6 rounded-full gradient-brand text-white text-xs font-mono font-semibold flex items-center justify-center shrink-0"
                }
              >
                {coluna.extra ? <Sparkles size={12} /> : coluna.ordem}
              </span>
              <h3 className="text-sm font-semibold text-ink leading-tight">{coluna.titulo}</h3>
            </div>
            <div className="space-y-3">
              {coluna.equipes.map((eq) => {
                const lider = getLiderEquipe(equipeUsuarios, usuarios, eq.id_equipe);
                const mentoresEquipe = getMentoresDaEquipe(equipeMentores, usuarios, eq.id_equipe);
                const tarefasEquipe = getTarefasDaEquipe(tarefas, eq.id_equipe);
                const atrasadas = tarefasEquipe.filter(
                  (t) => getStatusDescricao(statusTarefa, t.id_status) !== "Aprovada" && isPrazoVencido(t.data_limite)
                ).length;
                return (
                  <Link key={eq.id_equipe} to={`/admin/equipes/${eq.id_equipe}`}>
                    <Card className="p-4 hover:border-accent-orange/50 hover:shadow-md transition cursor-pointer">
                      <p className="text-sm font-semibold text-ink leading-tight">{eq.nome_equipe}</p>
                      <p className="text-xs text-text-soft mt-0.5 line-clamp-2">{eq.nome_ideia}</p>
                      {coluna.extra && (
                        <p className="text-[11px] text-accent-orange mt-1.5 font-medium">{eq.etapa_atual_nome}</p>
                      )}
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
              {coluna.equipes.length === 0 && (
                <p className="text-xs text-text-faint italic px-1">Nenhuma equipe aqui.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
