import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, KanbanSquare, ListChecks, BarChart3, LogOut, GraduationCap } from "lucide-react";
import { Logo } from "../components/Logo";
import { useAuth } from "../store/AuthContext";

const navItems = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, end: true },
  { to: "/admin/equipes", label: "Funil de equipes", icon: KanbanSquare },
  { to: "/admin/tarefas", label: "Tarefas", icon: ListChecks },
  { to: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
];

export function AdminLayout() {
  const { usuarioAtual, sair } = useAuth();
  const navigate = useNavigate();

  function handleSair() {
    sair();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex bg-paper">
      <aside className="w-64 shrink-0 bg-ink text-white flex flex-col">
        <div className="px-5 py-6 border-b border-white/10">
          <Logo variant="light" />
          <p className="text-[11px] text-white/50 mt-1 font-mono">painel · coordenação</p>
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition",
                  isActive ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5",
                ].join(" ")
              }
            >
              <item.icon size={17} strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl">
            <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-semibold shrink-0">
              {usuarioAtual?.nome
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{usuarioAtual?.nome}</p>
              <p className="text-[11px] text-white/50 truncate flex items-center gap-1">
                <GraduationCap size={11} /> {usuarioAtual?.perfil === "admin" ? "Administrador(a)" : "Mentor(a)"}
              </p>
            </div>
          </div>
          <button
            onClick={handleSair}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition"
          >
            <LogOut size={17} /> Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
