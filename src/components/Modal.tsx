import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { classNames } from '../lib/format';

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
  rodape?: ReactNode;
  largura?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  semFechar?: boolean;
}

const larguras = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-[min(96vw,1400px)]',
};

export function Modal({
  aberto,
  onFechar,
  titulo,
  descricao,
  children,
  rodape,
  largura = 'md',
  semFechar = false,
}: ModalProps) {
  const painelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const foco = window.setTimeout(() => painelRef.current?.focus(), 30);
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape' && !semFechar) onFechar();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => {
      document.body.style.overflow = anterior;
      window.clearTimeout(foco);
      window.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto, onFechar, semFechar]);

  if (!aberto) return null;

  return createPortal(
    <div
      data-modal-root
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      <div
        className="absolute inset-0 bg-brand-950/55 backdrop-blur-[3px] animate-fade"
        onClick={() => !semFechar && onFechar()}
        aria-hidden
      />
      <div
        ref={painelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        className={classNames(
          'relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-paper-light shadow-float outline-none sm:rounded-3xl',
          larguras[largura],
          'animate-rise',
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line-soft bg-white px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id="modal-titulo" className="font-serif text-xl font-semibold text-ink">
              {titulo}
            </h2>
            {descricao && <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{descricao}</p>}
          </div>
          {!semFechar && (
            <button
              type="button"
              onClick={onFechar}
              className="rounded-full p-2 text-ink-muted transition hover:bg-paper-deep hover:text-ink"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {rodape && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line-soft bg-white px-5 py-3.5 sm:px-6">
            {rodape}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
