import type { ReactNode } from 'react';
import { classNames } from '../lib/format';

interface EmptyStateProps {
  icone: ReactNode;
  titulo: string;
  descricao: string;
  acao?: ReactNode;
  className?: string;
  compacto?: boolean;
}

export function EmptyState({ icone, titulo, descricao, acao, className, compacto }: EmptyStateProps) {
  return (
    <div
      className={classNames(
        'flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-paper-light/60 text-center',
        compacto ? 'px-5 py-8' : 'px-6 py-14',
        className,
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        {icone}
      </div>
      <h3 className="font-serif text-lg font-semibold text-ink">{titulo}</h3>
      <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-muted">{descricao}</p>
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  );
}
