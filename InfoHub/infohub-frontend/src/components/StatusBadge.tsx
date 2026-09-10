import type { StatusTarefaDescricao } from "../types";
import { statusEstilo } from "../utils/selectors";

export function StatusBadge({ status }: { status: StatusTarefaDescricao }) {
  const s = statusEstilo[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}
