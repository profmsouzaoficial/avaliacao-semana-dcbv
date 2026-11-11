import type { ReactNode } from 'react';
import { classNames } from '../lib/format';

interface BrandProps {
  tom?: 'claro' | 'escuro';
  compacto?: boolean;
  className?: string;
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden fill="none">
      <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1.4" opacity="0.38" />
      <circle cx="32" cy="32" r="22.5" stroke="currentColor" strokeWidth="0.9" opacity="0.22" />
      <path
        d="M21.5 18.5h10.2c9.6 0 15.3 5.3 15.3 13.3 0 8.1-5.7 13.7-15.3 13.7H21.5V18.5Z"
        stroke="currentColor"
        strokeWidth="3.1"
        strokeLinejoin="round"
      />
      <path d="M27.5 24.5h4.2c5 0 8 2.7 8 7.3s-3 7.7-8 7.7h-4.2v-15Z" fill="currentColor" opacity="0.16" />
      <circle cx="47.5" cy="17.5" r="3.2" fill="#d99a2b" />
    </svg>
  );
}

export function Brand({ tom = 'escuro', compacto = false, className }: BrandProps) {
  const claro = tom === 'claro';
  return (
    <div className={classNames('flex items-center gap-3', className)}>
      <BrandMark className={classNames('shrink-0', compacto ? 'h-9 w-9' : 'h-11 w-11', claro ? 'text-white' : 'text-brand-800')} />
      <div className="min-w-0">
        <div
          className={classNames(
            'font-serif text-[17px] font-semibold leading-tight tracking-[-0.02em]',
            claro ? 'text-white' : 'text-brand-900',
          )}
        >
          I Semana do DCBV
        </div>
        {!compacto && (
          <div
            className={classNames(
              'mt-0.5 text-[9.5px] font-bold uppercase leading-tight tracking-[0.15em]',
              claro ? 'text-brand-200' : 'text-ink-muted',
            )}
          >
            Bases da Saúde · UFJF/GV
          </div>
        )}
      </div>
    </div>
  );
}

export function BrandFooter({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
      {children}
    </div>
  );
}
