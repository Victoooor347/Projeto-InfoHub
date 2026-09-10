interface LogoProps {
  variant?: "light" | "dark";
  className?: string;
  /**
   * "icon"     -> só o bulbo (avatar, sidebar colapsada, favicon-like)
   * "wordmark" -> lockup horizontal completo (bulbo + "info hub" + tagline)
   * "mark"     -> lockup empilhado grande (bulbo + "infohub" + tagline), sempre em cores originais
   */
  as?: "icon" | "wordmark" | "mark";
}

/**
 * Usa as artes originais fornecidas pela equipe do InfoHub (em vez de um logo
 * recriado). O bulbo colorido funciona bem em qualquer fundo, mas o lockup de
 * texto foi desenhado em cinza/vermelho para fundo claro — por isso, em fundos
 * escuros (variant="light"), combinamos o ícone real com um wordmark tipográfico
 * próprio em branco, e reservamos o PNG oficial completo para superfícies claras
 * (ou dentro de um cartão branco, ver LoginPage).
 */
export function Logo({ variant = "dark", className = "", as = "wordmark" }: LogoProps) {
  if (as === "mark") {
    return (
      <img
        src="/brand/infohub-stacked.png"
        alt="InfoHub — Conectando conhecimento, tecnologia & inovação"
        className={`h-auto w-full object-contain ${className}`}
      />
    );
  }

  if (as === "icon") {
    return (
      <img src="/brand/infohub-icon.png" alt="InfoHub" className={`h-8 w-auto object-contain ${className}`} />
    );
  }

  if (variant === "light") {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <img src="/brand/infohub-icon.png" alt="" className="h-7 w-auto object-contain" />
        <span className="font-display font-semibold text-lg tracking-tight text-white">
          Info<span className="text-gradient-brand">Hub</span>
        </span>
      </div>
    );
  }

  return (
    <img
      src="/brand/infohub-horizontal.png"
      alt="InfoHub — Conectando conhecimento, tecnologia & inovação"
      className={`h-9 w-auto object-contain ${className}`}
    />
  );
}
