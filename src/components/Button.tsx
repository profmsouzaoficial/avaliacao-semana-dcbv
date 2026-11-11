import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { classNames } from '../lib/format';

type Variante = 'primary' | 'secondary' | 'ghost' | 'danger' | 'amber' | 'dark';
type Tamanho = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamanho?: Tamanho;
  carregando?: boolean;
  icone?: ReactNode;
  children?: ReactNode;
}

const variantes: Record<Variante, string> = {
  primary:
    'bg-brand-800 text-white hover:bg-brand-700 active:bg-brand-900 shadow-sm disabled:bg-brand-800/50',
  secondary:
    'border border-line bg-white text-ink hover:border-brand-300 hover:bg-brand-50 active:bg-brand-100 disabled:opacity-50',
  ghost:
    'text-ink-soft hover:bg-brand-50 hover:text-brand-800 active:bg-brand-100 disabled:opacity-50',
  danger:
    'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-600 disabled:opacity-50',
  amber:
    'bg-accent-500 text-brand-950 hover:bg-accent-400 active:bg-accent-600 shadow-sm disabled:opacity-50',
  dark:
    'bg-ink text-paper hover:bg-brand-900 active:bg-brand-950 disabled:opacity-50',
};

const tamanhos: Record<Tamanho, string> = {
  sm: 'h-9 px-3 text-[13px] gap-1.5 rounded-xl',
  md: 'h-11 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-5 text-[15px] gap-2.5 rounded-2xl',
};

export function Button({
  variante = 'primary',
  tamanho = 'md',
  carregando = false,
  icone,
  children,
  className,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || carregando}
      className={classNames(
        'inline-flex select-none items-center justify-center font-semibold transition-all duration-150',
        'disabled:cursor-not-allowed',
        variantes[variante],
        tamanhos[tamanho],
        className,
      )}
      {...props}
    >
      {carregando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icone}
      {children}
    </button>
  );
}
