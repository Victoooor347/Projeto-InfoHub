import { createContext, useContext, useState, type ReactNode } from "react";
import type { Usuario } from "../types";
import { useData } from "./DataContext";

interface AuthContextValue {
  usuarioAtual: Usuario | null;
  entrar: (email: string, senha: string) => { ok: boolean; erro?: string };
  entrarComo: (usuario: Usuario) => void;
  sair: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { usuarios } = useData();
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null);

  function entrar(email: string, senha: string) {
    const encontrado = usuarios.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!encontrado) {
      return { ok: false, erro: "Não encontramos uma conta com esse e-mail." };
    }
    if (encontrado.senha !== senha) {
      return { ok: false, erro: "Senha incorreta. Confira e tente novamente." };
    }
    setUsuarioAtual(encontrado);
    return { ok: true };
  }

  function entrarComo(usuario: Usuario) {
    setUsuarioAtual(usuario);
  }

  function sair() {
    setUsuarioAtual(null);
  }

  return (
    <AuthContext.Provider value={{ usuarioAtual, entrar, entrarComo, sair }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
