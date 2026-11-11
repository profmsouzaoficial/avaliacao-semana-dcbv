import type { ReactNode } from 'react';
import { classNames } from '../lib/format';

type Tom = 'neutral' | 'brand' | 'amber' | 'rose' | 'green' | 'sky' | 'violet';

interface BadgeProps {
  children: ReactNode;
  tom?: Tom;
  className?: string;
  ponto?: boolean;
}

const tons: Record<Tom, string> = {
  neutral: 'bg-paper-deep text-ink-soft border-line',
  brand: 'bg-brand-50 text-brand-800 border-brand-200',
  amber: 'bg-accent-50 text-accent-700 border-accent-200',
  rose: 'bg-rose-100 text-rose-600 border-rose-500/20',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
};

const pontos: Record<Tom, string> = {
  neutral: 'bg-ink-muted',
  brand: 'bg-brand-500',
  amber: 'bg-accent-500',
  rose: 'bg-rose-500',
  green: 'bg-emerald-500',
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
};

export function Badge({ children, tom = 'neutral', className, ponto = false }: BadgeProps) {
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none',
        tons[tom],
        className,
      )}
    >
      {ponto && <span className={classNames('h-1.5 w-1.5 rounded-full', pontos[tom])} />}
      {children}
    </span>
  );
}
