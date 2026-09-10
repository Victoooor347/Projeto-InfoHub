import type { Etapa } from "../types";

interface StageRailProps {
  etapas: Etapa[];
  etapaAtual: number;
  size?: "sm" | "md";
  pronto?: boolean;
}

/**
 * Trilho horizontal com os 6 nós da jornada InfoHub -> InovAMF.
 * Elemento de assinatura visual do produto: reaparece no kanban,
 * no detalhe da equipe e na área do aluno para reforçar "em que
 * ponto do funil" cada equipe está.
 */
export function StageRail({ etapas, etapaAtual, size = "md", pronto }: StageRailProps) {
  const ordenadas = [...etapas].sort((a, b) => a.id_etapa - b.id_etapa);
  const isSm = size === "sm";

  return (
    <div className="w-full">
      <div className="relative flex items-center justify-between">
        <div
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-paper-line"
          aria-hidden
        />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] gradient-brand transition-all duration-500"
          style={{
            width: `${(Math.max(0, etapaAtual - 1) / (ordenadas.length - 1)) * 100}%`,
          }}
          aria-hidden
        />
        {ordenadas.map((etapa) => {
          const concluida = etapa.id_etapa < etapaAtual;
          const atual = etapa.id_etapa === etapaAtual;
          return (
            <div key={etapa.id_etapa} className="relative z-10 flex flex-col items-center group">
              <div
                title={etapa.nome}
                className={[
                  "flex items-center justify-center rounded-full font-mono font-semibold border-2 transition-colors",
                  isSm ? "w-5 h-5 text-[10px]" : "w-8 h-8 text-xs",
                  concluida
                    ? "gradient-brand text-white border-transparent"
                    : atual
                    ? pronto
                      ? "bg-brand-success border-brand-success text-white"
                      : "bg-white border-accent-orange text-accent-orange"
                    : "bg-white border-paper-line text-text-faint",
                ].join(" ")}
              >
                {etapa.id_etapa}
              </div>
              {!isSm && (
                <span
                  className={[
                    "mt-1.5 text-[10px] leading-tight text-center max-w-[64px] font-medium",
                    concluida || atual ? "text-ink" : "text-text-faint",
                  ].join(" ")}
                >
                  {etapa.nome.split(" – ")[0]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
