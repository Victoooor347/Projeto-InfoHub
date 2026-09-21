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
// Só no servidor de desenvolvimento do Vite (npm run dev, porta 5173) é que
// a API fica em outro endereço (http://localhost:3333).
//
// Usa MODE, e não PROD: o Coolify builda com NODE_ENV=development, e nesse
// caso o Vite marca PROD=false mesmo no `vite build` — o que fazia o site
// publicado tentar falar com localhost:3333. MODE continua "production" em
// qualquer `vite build`.
const BASE_URL = (
  import.meta.env.VITE_API_URL ?? (import.meta.env.MODE === "development" ? "http://localhost:3333" : "")
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

// ------------------------------------------------------------ refresh token
//
// O token de acesso dura pouco (15 min). Quando a API responde 401, pedimos
// um novo em POST /api/auth/refresh — o refresh token viaja sozinho num
// cookie httpOnly (o JavaScript nem consegue lê-lo) — e repetimos a chamada.
// Para o usuário, a sessão simplesmente continua.

interface RespostaRenovacao {
  token: string;
  usuario: unknown;
}

let renovacaoEmAndamento: Promise<RespostaRenovacao | null> | null = null;

/**
 * Pede um token de acesso novo usando o cookie de sessão. Se várias
 * chamadas derem 401 ao mesmo tempo, todas esperam a MESMA renovação.
 * Devolve null se não houver sessão válida (aí é preciso logar de novo).
 */
export function renovarSessao(): Promise<RespostaRenovacao | null> {
  if (!renovacaoEmAndamento) {
    renovacaoEmAndamento = (async () => {
      try {
        const resposta = await fetch(`${BASE_URL}/api/auth/refresh`, { method: "POST", credentials: "include" });
        if (!resposta.ok) return null;
        const dados = (await resposta.json()) as RespostaRenovacao;
        setToken(dados.token);
        return dados;
      } catch {
        return null;
      } finally {
        renovacaoEmAndamento = null;
      }
    })();
  }
  return renovacaoEmAndamento;
}

export async function request<T>(caminho: string, opcoes: Opcoes = {}, jaRenovou = false): Promise<T> {
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
      credentials: "include", // manda o cookie de sessão (necessário no login/logout/refresh)
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

    // token de acesso expirado: tenta renovar UMA vez e repete a chamada
    if (resposta.status === 401 && auth && token && !caminho.startsWith("/api/auth/")) {
      if (!jaRenovou && (await renovarSessao())) {
        return request<T>(caminho, opcoes, true);
      }
      // sem sessão válida: limpa e avisa o AuthContext para deslogar
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

/**
 * Baixa um arquivo protegido da API (ex.: "/api/arquivos/12") mandando o
 * token — um <a href> comum não manda o cabeçalho Authorization.
 */
export async function baixarArquivo(caminho: string, nomeArquivo: string): Promise<void> {
  const buscar = () => {
    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`${BASE_URL}${caminho}`, { headers });
  };

  let resposta: Response;
  try {
    resposta = await buscar();
    // token de acesso expirou: renova e tenta de novo
    if (resposta.status === 401 && (await renovarSessao())) resposta = await buscar();
  } catch {
    throw new ApiError("Não foi possível baixar o arquivo. Verifique sua conexão.", 0);
  }
  if (!resposta.ok) {
    const corpo = (await resposta.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(corpo.error ?? `Falha ao baixar o arquivo (${resposta.status})`, resposta.status);
  }

  const url = URL.createObjectURL(await resposta.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Lê um arquivo escolhido no <input type="file"> como base64 (sem o prefixo "data:..."). */
export function lerArquivoComoBase64(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => {
      const resultado = String(leitor.result ?? "");
      resolve(resultado.slice(resultado.indexOf(",") + 1));
    };
    leitor.onerror = () => reject(new Error("Não foi possível ler o arquivo"));
    leitor.readAsDataURL(arquivo);
  });
}

export const api = {
  get: <T>(caminho: string) => request<T>(caminho),
  post: <T>(caminho: string, body?: unknown, opcoes?: Omit<Opcoes, "method" | "body">) =>
    request<T>(caminho, { ...opcoes, method: "POST", body }),
  patch: <T>(caminho: string, body?: unknown) => request<T>(caminho, { method: "PATCH", body }),
  delete: <T>(caminho: string) => request<T>(caminho, { method: "DELETE" }),
};
