import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import type { Perfil } from "../types";

export function ProtectedRoute({ perfis, children }: { perfis: Perfil[]; children: ReactNode }) {
  const { usuarioAtual } = useAuth();

  if (!usuarioAtual) {
    return <Navigate to="/login" replace />;
  }

  if (!perfis.includes(usuarioAtual.perfil)) {
    const destino = usuarioAtual.perfil === "aluno" ? "/aluno" : "/admin";
    return <Navigate to={destino} replace />;
  }

  return <>{children}</>;
}
