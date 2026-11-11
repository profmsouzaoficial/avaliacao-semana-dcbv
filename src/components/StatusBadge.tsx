import { CheckCircle2, Circle, CircleDashed, MinusCircle } from 'lucide-react';
import type { StatusTrabalho } from '../types';
import { classNames } from '../lib/format';

const config = {
  pendente: {
    rotulo: 'Pendente',
    classe: 'bg-paper-deep text-ink-muted border-line',
    icone: <Circle className="h-3 w-3" />,
  },
  rascunho: {
    rotulo: 'Rascunho',
    classe: 'bg-accent-50 text-accent-700 border-accent-200',
    icone: <CircleDashed className="h-3 w-3" />,
  },
  concluida: {
    rotulo: 'Concluída',
    classe: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icone: <CheckCircle2 className="h-3 w-3" />,
  },
  'sem-atribuicao': {
    rotulo: 'Sem atribuição',
    classe: 'bg-paper-deep text-ink-muted border-line',
    icone: <MinusCircle className="h-3 w-3" />,
  },
};

export function StatusBadge({ status, className }: { status: StatusTrabalho['status']; className?: string }) {
  const c = config[status];
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10.5px] font-semibold leading-none',
        c.classe,
        className,
      )}
    >
      {c.icone}
      {c.rotulo}
    </span>
  );
}
