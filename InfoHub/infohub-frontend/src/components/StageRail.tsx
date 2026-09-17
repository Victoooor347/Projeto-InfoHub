import type { Etapa } from "../types";

interface StageRailProps {
  etapas: Etapa[];
  /** posição (campo `ordem`) da etapa atual dentro da jornada DESSA equipe — não é mais um id_etapa global */
  ordemAtual: number;
  size?: "sm" | "md";
  pronto?: boolean;
}

/**
 * Trilho horizontal com os nós da jornada de UMA equipe.
 * Elemento de assinatura visual do produto: reaparece no kanban,
 * no detalhe da equipe e na área do aluno para reforçar "em que
 * ponto do funil" cada equipe está.
 *
 * Desde que etapa passou a pertencer a cada equipe (o mentor pode
 * acrescentar etapas extras além das 6 padrão), a jornada pode ter
 * tamanhos diferentes por equipe — por isso a posição é sempre por
 * `ordem` (1, 2, 3...), nunca por `id_etapa` (que é só um id técnico,
 * sem significado de posição quando comparado entre equipes diferentes).
 */
export function StageRail({ etapas, ordemAtual, size = "md", pronto }: StageRailProps) {
  const ordenadas = [...etapas].sort((a, b) => a.ordem - b.ordem);
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
            width: `${(Math.max(0, ordemAtual - 1) / Math.max(1, ordenadas.length - 1)) * 100}%`,
          }}
          aria-hidden
        />
        {ordenadas.map((etapa) => {
          const concluida = etapa.ordem < ordemAtual;
          const atual = etapa.ordem === ordemAtual;
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
                {etapa.ordem}
              </div>
              {!isSm && (
                <span
                  className={[
                    "mt-1.5 text-[10px] leading-tight text-center max-w-[64px] font-medium",
                    concluida || atual ? "text-ink" : "text-text-faint",
                  ].join(" ")}
                >
                  {etapa.nome.split(" – ")[0]}
                  {!etapa.padrao && <span className="block text-accent-orange">extra</span>}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
