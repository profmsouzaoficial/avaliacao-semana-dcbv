import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { classNames } from '../lib/format';

const estilos = {
  sucesso: {
    caixa: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    icone: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  },
  erro: {
    caixa: 'border-rose-500/25 bg-rose-100 text-rose-600',
    icone: <AlertCircle className="h-4 w-4 text-rose-500" />,
  },
  info: {
    caixa: 'border-brand-200 bg-brand-50 text-brand-900',
    icone: <Info className="h-4 w-4 text-brand-600" />,
  },
};

export function Toast() {
  const { toast, fecharToast } = useApp();
  if (!toast) return null;
  const estilo = estilos[toast.tipo];
  return (
    <div
      className="pointer-events-none fixed inset-x-3 bottom-3 z-[60] flex justify-center sm:inset-x-auto sm:right-5 sm:bottom-5 sm:justify-end"
      role="status"
      aria-live="polite"
    >
      <div
        className={classNames(
          'pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-2xl border px-4 py-3 shadow-float animate-rise',
          estilo.caixa,
        )}
      >
        <span className="mt-0.5 shrink-0">{estilo.icone}</span>
        <p className="flex-1 text-[13px] font-medium leading-relaxed">{toast.mensagem}</p>
        <button
          type="button"
          onClick={fecharToast}
          className="rounded-full p-1 opacity-60 transition hover:bg-black/5 hover:opacity-100"
          aria-label="Fechar aviso"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
