import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import { TelaCarregando } from "./Kit";
import type { Perfil } from "../types";

export function ProtectedRoute({ perfis, children }: { perfis: Perfil[]; children: ReactNode }) {
  const { usuarioAtual, restaurandoSessao } = useAuth();
  const location = useLocation();

  // Sem isso, um F5 dentro da área logada redirecionaria para /login antes de
  // o GET /auth/me terminar de revalidar o token guardado no localStorage.
  if (restaurandoSessao) {
    return <TelaCarregando mensagem="Restaurando sua sessão…" />;
  }

  if (!usuarioAtual) {
    return <Navigate to="/login" replace />;
  }

  // senha provisória: só libera o sistema depois de trocar
  if (usuarioAtual.deve_trocar_senha && location.pathname !== "/trocar-senha") {
    return <Navigate to="/trocar-senha" replace />;
  }

  if (!perfis.includes(usuarioAtual.perfil)) {
    const destino = usuarioAtual.perfil === "aluno" ? "/aluno" : "/admin";
    return <Navigate to={destino} replace />;
  }

  return <>{children}</>;
}
