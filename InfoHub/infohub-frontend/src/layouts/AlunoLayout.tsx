import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Home, ListChecks, LogOut } from "lucide-react";
import { Logo } from "../components/Logo";
import { FaixaErro, TelaCarregando } from "../components/Kit";
import { useAuth } from "../store/AuthContext";
import { useData } from "../store/DataContext";

const navItems = [
  { to: "/aluno", label: "Minha jornada", icon: Home, end: true },
  { to: "/aluno/tarefas", label: "Tarefas", icon: ListChecks },
];

export function AlunoLayout() {
  const { usuarioAtual, sair } = useAuth();
  const { carregando, erroCarregamento, erroAcao, limparErroAcao, recarregar } = useData();
  const navigate = useNavigate();

  function handleSair() {
    sair();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-paper pb-20 md:pb-0">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-paper-line">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm font-medium text-ink">{usuarioAtual?.nome}</span>
              <span className="text-[11px] text-text-soft">Área do aluno</span>
            </div>
            <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-xs font-semibold text-white">
              {usuarioAtual?.nome
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0])
                .join("")}
            </div>
            <button
              onClick={handleSair}
              className="text-text-soft hover:text-ink transition p-2 rounded-lg hover:bg-paper-alt"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <nav className="max-w-3xl mx-auto px-4 hidden md:flex gap-1 pb-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition",
                  isActive ? "bg-ink text-white" : "text-text-soft hover:bg-paper-alt",
                ].join(" ")
              }
            >
              <item.icon size={16} /> {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {(erroCarregamento || erroAcao) && (
          <div className="mb-4 space-y-2">
            {erroCarregamento && (
              <FaixaErro mensagem={erroCarregamento} rotuloAcao="tentar de novo" onAcao={recarregar} />
            )}
            {erroAcao && <FaixaErro mensagem={erroAcao} rotuloAcao="fechar" onAcao={limparErroAcao} />}
          </div>
        )}
        {carregando ? <TelaCarregando mensagem="Carregando suas equipes…" /> : <Outlet />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-20 bg-white border-t border-paper-line flex md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              [
                "flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition",
                isActive ? "text-accent-orange" : "text-text-soft",
              ].join(" ")
            }
          >
            <item.icon size={19} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
