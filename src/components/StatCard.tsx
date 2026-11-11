import type { ReactNode } from 'react';
import { classNames } from '../lib/format';

interface StatCardProps {
  rotulo: string;
  valor: ReactNode;
  detalhe?: string;
  icone: ReactNode;
  tom?: 'brand' | 'amber' | 'rose' | 'sky';
  className?: string;
}

const tons = {
  brand: 'bg-brand-50 text-brand-700',
  amber: 'bg-accent-50 text-accent-700',
  rose: 'bg-rose-100 text-rose-600',
  sky: 'bg-sky-50 text-sky-700',
};

export function StatCard({ rotulo, valor, detalhe, icone, tom = 'brand', className }: StatCardProps) {
  return (
    <div className={classNames('card p-4 sm:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">{rotulo}</div>
          <div className="mt-2 font-serif text-[30px] font-semibold leading-none tracking-tight text-ink">
            {valor}
          </div>
        </div>
        <div className={classNames('flex h-9 w-9 items-center justify-center rounded-xl', tons[tom])}>
          {icone}
        </div>
      </div>
      {detalhe && <p className="mt-2.5 text-[12px] leading-snug text-ink-muted">{detalhe}</p>}
    </div>
  );
}
