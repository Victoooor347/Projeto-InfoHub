import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import { TelaCarregando } from "./Kit";
import type { Perfil } from "../types";

export function ProtectedRoute({ perfis, children }: { perfis: Perfil[]; children: ReactNode }) {
  const { usuarioAtual, restaurandoSessao } = useAuth();

  // Sem isso, um F5 dentro da área logada redirecionaria para /login antes de
  // o GET /auth/me terminar de revalidar o token guardado no localStorage.
  if (restaurandoSessao) {
    return <TelaCarregando mensagem="Restaurando sua sessão…" />;
  }

  if (!usuarioAtual) {
    return <Navigate to="/login" replace />;
  }

  if (!perfis.includes(usuarioAtual.perfil)) {
    const destino = usuarioAtual.perfil === "aluno" ? "/aluno" : "/admin";
    return <Navigate to={destino} replace />;
  }

  return <>{children}</>;
}
