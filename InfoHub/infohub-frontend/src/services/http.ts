/**
 * Cliente HTTP único do InfoHub.
 *
 * Toda chamada à API passa por aqui, então é o lugar certo para: montar a base
 * URL, injetar o token JWT, traduzir a resposta de erro do backend
 * (`{ error, detalhes }`) para uma exceção tipada e derrubar a sessão quando o
 * token expira.
 */

// Em produção (deploy único) o frontend é servido pelo próprio backend, então
// a API está na MESMA origem: base vazia = chamadas relativas ("/api/...").
// Em desenvolvimento (npm run dev, porta 5173) continua apontando pro :3333.
const BASE_URL = (
  import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? "" : "http://localhost:3333")
).replace(/\/+$/, "");

const CHAVE_TOKEN = "infohub:token";

/** Disparado no window quando a API responde 401 com um token que já estava salvo. */
export const EVENTO_SESSAO_EXPIRADA = "infohub:sessao-expirada";

export class ApiError extends Error {
  status: number;
  /** Erros por campo, quando o backend devolve 422 do Zod. */
  detalhes?: Record<string, string>;

  constructor(mensagem: string, status: number, detalhes?: Record<string, string>) {
    super(mensagem);
    this.name = "ApiError";
    this.status = status;
    this.detalhes = detalhes;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(CHAVE_TOKEN);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(CHAVE_TOKEN, token);
  else localStorage.removeItem(CHAVE_TOKEN);
}

interface Opcoes {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Por padrão manda o token se existir; `false` força chamada anônima. */
  auth?: boolean;
}

export async function request<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const { method = "GET", body, auth = true } = opcoes;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let resposta: Response;
  try {
    resposta = await fetch(`${BASE_URL}${caminho}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      `Não foi possível falar com a API em ${BASE_URL}. Verifique se o backend está rodando.`,
      0
    );
  }

  if (resposta.status === 204) return undefined as T;

  const texto = await resposta.text();
  let dados: unknown = null;
  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = null;
    }
  }

  if (!resposta.ok) {
    const corpo = (dados ?? {}) as { error?: string; detalhes?: Record<string, string> };

    // token inválido/expirado: limpa e avisa o AuthContext para deslogar
    if (resposta.status === 401 && token) {
      setToken(null);
      window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
    }

    throw new ApiError(corpo.error ?? `Erro ${resposta.status} ao chamar a API`, resposta.status, corpo.detalhes);
  }

  return dados as T;
}

/** Extrai uma mensagem exibível de qualquer erro vindo de uma chamada à API. */
export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof ApiError) {
    if (erro.detalhes) {
      const campos = Object.entries(erro.detalhes)
        .map(([campo, msg]) => (campo === "_" ? msg : `${campo}: ${msg}`))
        .join(" · ");
      return campos ? `${erro.message} (${campos})` : erro.message;
    }
    return erro.message;
  }
  if (erro instanceof Error) return erro.message;
  return "Erro inesperado.";
}

export const api = {
  get: <T>(caminho: string) => request<T>(caminho),
  post: <T>(caminho: string, body?: unknown, opcoes?: Omit<Opcoes, "method" | "body">) =>
    request<T>(caminho, { ...opcoes, method: "POST", body }),
  patch: <T>(caminho: string, body?: unknown) => request<T>(caminho, { method: "PATCH", body }),
  delete: <T>(caminho: string) => request<T>(caminho, { method: "DELETE" }),
};
