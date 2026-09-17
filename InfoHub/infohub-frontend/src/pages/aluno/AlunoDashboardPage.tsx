import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { useAuth } from "../../store/AuthContext";
import { useData } from "../../store/DataContext";
import { Card, EmptyState, Pill } from "../../components/Kit";
import { StageRail } from "../../components/StageRail";
import { getEquipesDoUsuario, getEquipeMembros, getPapelDoUsuarioNaEquipe, getStatusDescricao, formatarData, isPrazoVencido } from "../../utils/selectors";

export function AlunoDashboardPage() {
  const { usuarioAtual } = useAuth();
  const { equipes, equipeUsuarios, usuarios, etapas, tarefas, statusTarefa } = useData();

  if (!usuarioAtual) return null;

  const idsEquipes = getEquipesDoUsuario(equipeUsuarios, usuarioAtual.id_usuario);
  const minhasEquipes = equipes.filter((eq) => idsEquipes.includes(eq.id_equipe));

  return (
    <div>
      <p className="font-mono text-xs text-accent-orange font-medium tracking-wide">MINHA JORNADA</p>
      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink mt-1">
        Olá, {usuarioAtual.nome.split(" ")[0]} 👋
      </h1>
      <p className="text-text-soft text-sm mt-1">
        {minhasEquipes.length > 0
          ? `Você participa de ${minhasEquipes.length} equipe${minhasEquipes.length > 1 ? "s" : ""} no InfoHub.`
          : "Você ainda não está em nenhuma equipe."}
      </p>

      {minhasEquipes.length === 0 && (
        <div className="mt-6">
          <EmptyState
            title="Nenhuma ideia cadastrada"
            description="Envie o formulário inicial para entrar na Etapa 1 da jornada InfoHub."
            action={
              <Link to="/inscricao" className="text-accent-orange text-sm font-semibold hover:underline">
                Inscrever minha ideia →
              </Link>
            }
          />
        </div>
      )}

      <div className="space-y-6 mt-6">
        {minhasEquipes.map((equipe) => {
          const membros = getEquipeMembros(equipeUsuarios, usuarios, equipe.id_equipe);
          const tarefasEquipe = tarefas.filter((t) => t.id_equipe === equipe.id_equipe);
          const pendentes = tarefasEquipe.filter((t) => getStatusDescricao(statusTarefa, t.id_status) !== "Aprovada");
          const proximaTarefa = [...pendentes].sort((a, b) => a.data_limite.localeCompare(b.data_limite))[0];
          const meuPapel = getPapelDoUsuarioNaEquipe(equipeUsuarios, usuarioAtual.id_usuario, equipe.id_equipe);

          return (
            <Card key={equipe.id_equipe} className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-semibold text-lg text-ink">{equipe.nome_equipe}</h2>
                    {meuPapel && (
                      <Pill className={meuPapel === "lider" ? "bg-accent-orange/10 text-accent-orange" : ""}>
                        Você é {meuPapel === "lider" ? "líder" : "integrante"}
                      </Pill>
                    )}
                    {equipe.pronto_para_inovamf && (
                      <Pill className="bg-brand-success-soft text-brand-success">
                        <Sparkles size={12} /> Pronta para o InovAMF
                      </Pill>
                    )}
                  </div>
                  <p className="text-sm text-text-soft mt-0.5">{equipe.nome_ideia}</p>
                </div>
                <span className="text-xs text-text-faint">{membros.length} integrante(s)</span>
              </div>

              <div className="mt-6">
                <StageRail
                  etapas={etapas.filter((e) => e.id_equipe === equipe.id_equipe)}
                  ordemAtual={equipe.etapa_atual_ordem}
                  pronto={equipe.pronto_para_inovamf}
                />
              </div>

              <div className="mt-6 pt-5 border-t border-paper-line flex flex-wrap items-center justify-between gap-3">
                {proximaTarefa ? (
                  <div>
                    <p className="text-xs text-text-soft">Próxima entrega</p>
                    <p className="text-sm font-medium text-ink mt-0.5">{proximaTarefa.titulo}</p>
                    <p className="text-xs text-text-faint font-mono mt-0.5">
                      prazo {formatarData(proximaTarefa.data_limite)}
                      {isPrazoVencido(proximaTarefa.data_limite) && (
                        <span className="text-brand-danger font-semibold"> · atrasada</span>
                      )}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-text-soft">Nenhuma tarefa pendente por aqui. 🎉</p>
                )}
                <Link
                  to="/aluno/tarefas"
                  className="text-sm font-semibold text-accent-orange flex items-center gap-1 hover:underline"
                >
                  Ver tarefas <ArrowUpRight size={14} />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
