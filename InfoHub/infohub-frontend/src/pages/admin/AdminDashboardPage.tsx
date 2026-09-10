import { Link } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, Mail, Rocket, Users2 } from "lucide-react";
import { useData } from "../../store/DataContext";
import { Card, Kpi, Pill } from "../../components/Kit";
import { getStatusDescricao, isPrazoVencido, formatarData, equipeProntaParaInovAMF } from "../../utils/selectors";

export function AdminDashboardPage() {
  const { equipes, etapas, tarefas, statusTarefa, usuarios, equipeMentores } = useData();

  const equipesAtivas = equipes.length;
  const tarefasAtrasadas = tarefas.filter(
    (t) => getStatusDescricao(statusTarefa, t.id_status) !== "Aprovada" && isPrazoVencido(t.data_limite)
  );
  const prontasParaInovAMF = equipes.filter(equipeProntaParaInovAMF);
  const equipesSemMentor = equipes.filter((eq) => !equipeMentores.some((em) => em.id_equipe === eq.id_equipe));

  const distribuicao = etapas.map((etapa) => ({
    etapa,
    total: equipes.filter((eq) => eq.id_etapa_atual === etapa.id_etapa).length,
  }));
  const maxDistribuicao = Math.max(1, ...distribuicao.map((d) => d.total));

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="font-mono text-xs text-accent-orange font-medium tracking-wide">VISÃO GERAL</p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink mt-1">
            O funil InfoHub → InovAMF hoje
          </h1>
          <p className="text-text-soft text-sm mt-1">{equipesAtivas} equipes em acompanhamento no ciclo atual.</p>
        </div>
        <Pill className="bg-brand-info-soft text-brand-info">
          <Mail size={12} /> E-mails via Gmail + Resend
        </Pill>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Kpi label="Equipes ativas" value={equipesAtivas} hint="Cadastradas no InfoHub" accent />
        <Kpi
          label="Tarefas atrasadas"
          value={tarefasAtrasadas.length}
          hint={tarefasAtrasadas.length > 0 ? "Precisam de atenção" : "Tudo em dia"}
        />
        <Kpi label="Prontas para InovAMF" value={prontasParaInovAMF.length} hint="Etapa 6 concluída" />
        <Kpi label="Mentores ativos" value={usuarios.filter((u) => u.perfil === "mentor").length} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-8">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-ink">Distribuição por etapa</h2>
            <Link
              to="/admin/equipes"
              className="text-xs font-semibold text-accent-orange flex items-center gap-1 hover:underline"
            >
              Ver funil completo <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="mt-5 space-y-3.5">
            {distribuicao.map(({ etapa, total }) => (
              <div key={etapa.id_etapa} className="flex items-center gap-3">
                <span className="w-6 font-mono text-xs text-text-faint">{etapa.id_etapa}</span>
                <span className="w-40 sm:w-52 text-sm text-ink truncate">{etapa.nome.split(" – ")[0]}</span>
                <div className="flex-1 h-2.5 bg-paper-alt rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-brand rounded-full transition-all"
                    style={{ width: `${(total / maxDistribuicao) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right text-sm font-medium text-ink">{total}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-display font-semibold text-ink flex items-center gap-2">
            <AlertTriangle size={16} className="text-brand-danger" /> Atenção imediata
          </h2>
          <div className="mt-4 space-y-3">
            {tarefasAtrasadas.length === 0 && (
              <p className="text-sm text-text-soft">Nenhuma tarefa atrasada no momento. 🎉</p>
            )}
            {tarefasAtrasadas.slice(0, 5).map((t) => {
              const equipe = equipes.find((eq) => eq.id_equipe === t.id_equipe);
              return (
                <Link
                  key={t.id_tarefa}
                  to={`/admin/equipes/${t.id_equipe}`}
                  className="flex items-start justify-between gap-2 group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate group-hover:text-accent-orange transition">
                      {t.titulo}
                    </p>
                    <p className="text-xs text-text-soft truncate">{equipe?.nome_equipe}</p>
                  </div>
                  <span className="text-[11px] font-mono text-brand-danger shrink-0 mt-0.5">
                    {formatarData(t.data_limite)}
                  </span>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Card className="p-6">
          <h2 className="font-display font-semibold text-ink flex items-center gap-2">
            <Rocket size={16} className="text-brand-success" /> Prontas para o InovAMF
          </h2>
          <div className="mt-4 space-y-3">
            {prontasParaInovAMF.length === 0 && (
              <p className="text-sm text-text-soft">Nenhuma equipe concluiu a jornada ainda.</p>
            )}
            {prontasParaInovAMF.map((eq) => (
              <Link
                key={eq.id_equipe}
                to={`/admin/equipes/${eq.id_equipe}`}
                className="flex items-center justify-between rounded-xl border border-paper-line px-3.5 py-2.5 hover:border-accent-orange/40 hover:bg-paper-alt/50 transition"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{eq.nome_equipe}</p>
                  <p className="text-xs text-text-soft">{eq.nome_ideia}</p>
                </div>
                <ArrowUpRight size={14} className="text-text-faint" />
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-display font-semibold text-ink flex items-center gap-2">
            <Users2 size={16} className="text-brand-info" /> Sem mentor atribuído
          </h2>
          <div className="mt-4 space-y-3">
            {equipesSemMentor.length === 0 && <p className="text-sm text-text-soft">Todas as equipes têm mentor.</p>}
            {equipesSemMentor.map((eq) => (
                <Link
                  key={eq.id_equipe}
                  to={`/admin/equipes/${eq.id_equipe}`}
                  className="flex items-center justify-between rounded-xl border border-paper-line px-3.5 py-2.5 hover:border-accent-orange/40 hover:bg-paper-alt/50 transition"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{eq.nome_equipe}</p>
                    <p className="text-xs text-text-soft">Etapa {eq.id_etapa_atual}</p>
                  </div>
                  <ArrowUpRight size={14} className="text-text-faint" />
                </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
