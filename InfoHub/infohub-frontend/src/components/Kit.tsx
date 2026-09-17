import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-paper-line shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-dashed border-paper-line bg-paper-alt/40">
      <h3 className="font-display font-semibold text-ink text-lg">{title}</h3>
      <p className="text-text-soft text-sm mt-1.5 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Kpi({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-text-soft">{label}</p>
      <p className={`font-display text-3xl font-semibold mt-2 ${accent ? "text-gradient-brand" : "text-ink"}`}>
        {value}
      </p>
      {hint && <p className="text-xs text-text-faint mt-1">{hint}</p>}
    </Card>
  );
}

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  className = "",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`gradient-brand text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:brightness-105 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  type = "button",
  className = "",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`bg-white border border-paper-line text-ink text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-paper-alt active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none ${className}`}
    >
      {children}
    </button>
  );
}

export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-paper-alt text-ink-soft ${className}`}
    >
      {children}
    </span>
  );
}

export function TelaCarregando({ mensagem = "Carregando…" }: { mensagem?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-text-soft">
      <span
        className="w-7 h-7 rounded-full border-2 border-paper-line border-t-accent-orange animate-spin"
        aria-hidden
      />
      <p className="text-sm">{mensagem}</p>
    </div>
  );
}

/** Faixa de erro usada para falhas de comunicação com a API. */
export function FaixaErro({
  mensagem,
  rotuloAcao,
  onAcao,
}: {
  mensagem: string;
  rotuloAcao?: string;
  onAcao?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 bg-brand-danger-soft text-brand-danger rounded-xl px-4 py-3 text-sm"
    >
      <span className="flex-1">{mensagem}</span>
      {onAcao && rotuloAcao && (
        <button onClick={onAcao} className="font-semibold hover:underline shrink-0" type="button">
          {rotuloAcao}
        </button>
      )}
    </div>
  );
}
