import { useState } from "react";
import { Download, ExternalLink, FileText } from "lucide-react";
import { baixarArquivo, mensagemDeErro } from "../services/http";
import type { Entregavel } from "../types";

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Mostra um entregável: arquivo enviado → botão de download (com o token);
 * link → abre em nova aba; qualquer outra coisa (dados antigos) → só o texto.
 */
export function EntregavelLink({ entregavel, className = "" }: { entregavel: Entregavel; className?: string }) {
  const [baixando, setBaixando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const { arquivo_url, arquivo_nome, arquivo_tamanho } = entregavel;

  const ehArquivo = Boolean(entregavel.id_arquivo) || arquivo_url.startsWith("/api/arquivos/");
  const ehLink = /^https?:\/\//i.test(arquivo_url);

  if (ehArquivo) {
    const nome = arquivo_nome ?? "arquivo";
    return (
      <span className={`flex items-center gap-1.5 min-w-0 ${className}`}>
        <button
          type="button"
          disabled={baixando}
          onClick={async () => {
            setErro(null);
            setBaixando(true);
            try {
              await baixarArquivo(arquivo_url, nome);
            } catch (e) {
              setErro(mensagemDeErro(e));
            } finally {
              setBaixando(false);
            }
          }}
          className="flex items-center gap-1.5 min-w-0 font-mono text-xs text-accent-orange hover:underline disabled:opacity-50"
          title="Baixar arquivo"
        >
          <Download size={13} className="shrink-0" />
          <span className="truncate">{baixando ? "baixando…" : nome}</span>
        </button>
        {arquivo_tamanho ? <span className="text-[11px] text-text-faint shrink-0">{formatarTamanho(arquivo_tamanho)}</span> : null}
        {erro && <span className="text-[11px] text-brand-danger">{erro}</span>}
      </span>
    );
  }

  if (ehLink) {
    return (
      <a
        href={arquivo_url}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-1.5 min-w-0 font-mono text-xs text-accent-orange hover:underline ${className}`}
        title={arquivo_url}
      >
        <ExternalLink size={13} className="shrink-0" />
        <span className="truncate">{arquivo_url.replace(/^https?:\/\//i, "")}</span>
      </a>
    );
  }

  return (
    <span className={`flex items-center gap-1.5 min-w-0 font-mono text-xs ${className}`}>
      <FileText size={13} className="shrink-0 text-text-faint" />
      <span className="truncate">{arquivo_url.split("/").pop()}</span>
    </span>
  );
}
