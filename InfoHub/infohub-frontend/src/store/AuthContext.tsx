import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import * as apiInfoHub from "../services/api";
import { EVENTO_SESSAO_EXPIRADA, getToken, mensagemDeErro, setToken } from "../services/http";
import type { Usuario } from "../types";

interface ResultadoLogin {
  ok: boolean;
  erro?: string;
  usuario?: Usuario;
}

interface AuthContextValue {
  usuarioAtual: Usuario | null;
  /** true enquanto a sessão salva no localStorage ainda está sendo restaurada. */
  restaurandoSessao: boolean;
  entrar: (email: string, senha: string) => Promise<ResultadoLogin>;
  /** Usado após a inscrição, que já devolve o usuário logado e o token. */
  entrarComToken: (token: string, usuario: Usuario) => void;
  sair: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null);
  const [restaurandoSessao, setRestaurandoSessao] = useState(true);

  // Ao abrir o app (ou dar F5), se houver token salvo, revalida com GET /auth/me.
  // O backend recarrega o usuário do banco a cada request, então uma conta
  // desativada perde o acesso na hora, sem esperar o token expirar.
  useEffect(() => {
    let cancelado = false;

    async function restaurar() {
      if (!getToken()) {
        setRestaurandoSessao(false);
        return;
      }
      try {
        const usuario = await apiInfoHub.auth.me();
        if (!cancelado) setUsuarioAtual(usuario);
      } catch {
        setToken(null);
        if (!cancelado) setUsuarioAtual(null);
      } finally {
        if (!cancelado) setRestaurandoSessao(false);
      }
    }

    restaurar();
    return () => {
      cancelado = true;
    };
  }, []);

  // Qualquer 401 vindo da API (token expirado no meio do uso) derruba a sessão.
  useEffect(() => {
    function aoExpirar() {
      setUsuarioAtual(null);
    }
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
  }, []);

  const entrar = useCallback(async (email: string, senha: string): Promise<ResultadoLogin> => {
    try {
      const { token, usuario } = await apiInfoHub.auth.login(email.trim(), senha);
      setToken(token);
      setUsuarioAtual(usuario);
      return { ok: true, usuario };
    } catch (erro) {
      return { ok: false, erro: mensagemDeErro(erro) };
    }
  }, []);

  const entrarComToken = useCallback((token: string, usuario: Usuario) => {
    setToken(token);
    setUsuarioAtual(usuario);
  }, []);

  const sair = useCallback(() => {
    setToken(null);
    setUsuarioAtual(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuarioAtual, restaurandoSessao, entrar, entrarComToken, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
