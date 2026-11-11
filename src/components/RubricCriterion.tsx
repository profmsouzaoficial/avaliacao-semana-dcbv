import { Check, ChevronDown, Lightbulb, Sparkles } from 'lucide-react';
import type { Criterio } from '../types';
import { categoriaPorNumero } from '../data/event';
import { classNames } from '../lib/format';

interface RubricCriterionProps {
  criterio: Criterio;
  valor: number | undefined;
  categoria: number;
  aberto: boolean;
  onAlternar: () => void;
  onSelecionar: (valor: number) => void;
}

const estilosSelecionado = [
  'border-ink-muted bg-ink text-white',
  'border-rose-500 bg-rose-500 text-white',
  'border-accent-500 bg-accent-500 text-brand-950',
  'border-brand-600 bg-brand-600 text-white',
  'border-brand-900 bg-brand-900 text-white ring-2 ring-accent-400 ring-offset-1',
];

const estilosDescritor = [
  'border-line bg-paper-deep text-ink-soft',
  'border-rose-500/20 bg-rose-100 text-rose-600',
  'border-accent-200 bg-accent-50 text-accent-700',
  'border-brand-200 bg-brand-50 text-brand-900',
  'border-brand-900 bg-brand-900 text-white',
];

export function RubricCriterion({
  criterio,
  valor,
  categoria,
  aberto,
  onAlternar,
  onSelecionar,
}: RubricCriterionProps) {
  const nivel = criterio.niveis.find((n) => n.valor === valor);
  const cat = categoriaPorNumero(categoria);

  return (
    <section
      id={`criterio-${criterio.id}`}
      className={classNames(
        'overflow-hidden rounded-3xl border bg-white transition-shadow',
        aberto ? 'border-brand-200 shadow-card' : 'border-line-soft hover:border-brand-200',
      )}
    >
      <button
        type="button"
        onClick={onAlternar}
        aria-expanded={aberto}
        className="flex w-full items-start gap-3 px-4 py-4 text-left sm:px-5"
      >
        <span
          className={classNames(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold',
            nivel
              ? 'bg-brand-800 text-white'
              : 'bg-paper-deep text-ink-muted',
          )}
        >
          {String(criterio.id).padStart(2, '0')}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-serif text-[17px] font-semibold leading-snug text-ink sm:text-[18px]">
              {criterio.titulo}
            </span>
            {nivel && (
              <span className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-800">
                <Check className="h-2.5 w-2.5" />
                {nivel.pontos}/20
              </span>
            )}
          </span>
          <span className="mt-1 block text-[12.5px] leading-relaxed text-ink-muted">
            {criterio.pergunta}
          </span>
        </span>
        <ChevronDown
          className={classNames(
            'mt-1 h-4 w-4 shrink-0 text-ink-muted transition-transform duration-200',
            aberto && 'rotate-180',
          )}
        />
      </button>

      {aberto && (
        <div className="animate-fade border-t border-line-soft px-4 pb-5 pt-4 sm:px-5">
          <div className="rounded-2xl border-l-[3px] border-accent-400 bg-accent-50/60 px-4 py-3">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-600" />
              <p className="text-[12px] leading-relaxed text-accent-700">{criterio.porQue}</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="eyebrow mb-2">O que observar</div>
            <ul className="grid gap-x-5 gap-y-1.5 sm:grid-cols-2">
              {criterio.observar.map((item) => (
                <li key={item} className="flex gap-2 text-[12px] leading-relaxed text-ink-soft">
                  <Check className="mt-1 h-3 w-3 shrink-0 text-brand-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {criterio.id === 3 && (
            <div className="mt-4 rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-600" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent-700">
                    Ajuste à categoria · {cat.curto}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-accent-700/90">
                    {cat.orientacaoMetodo}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="eyebrow">Marque um nível</div>
              <span className="text-[10.5px] text-ink-muted">0 a 4 · cada nível vale 5 pontos</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2" role="radiogroup" aria-label={criterio.titulo}>
              {criterio.niveis.map((n) => {
                const selecionado = valor === n.valor;
                return (
                  <button
                    key={n.valor}
                    type="button"
                    role="radio"
                    aria-checked={selecionado}
                    aria-label={`${n.rotulo}: ${n.pontos} pontos. ${n.descricao}`}
                    onClick={() => onSelecionar(n.valor)}
                    className={classNames(
                      'group flex min-h-[68px] flex-col items-start justify-between rounded-xl border p-2 text-left transition-all duration-150 sm:min-h-[74px] sm:p-2.5',
                      selecionado
                        ? estilosSelecionado[n.valor]
                        : 'border-line bg-paper-light text-ink-soft hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50/60',
                    )}
                  >
                    <span className="flex w-full items-center justify-between">
                      <span className={classNames('text-[16px] font-extrabold leading-none', selecionado ? '' : 'text-ink')}>
                        {n.pontos}
                      </span>
                      {selecionado && <Check className="h-3 w-3 opacity-80" />}
                    </span>
                    <span
                      className={classNames(
                        'mt-1 text-[9px] font-semibold leading-[1.15]',
                        selecionado ? 'opacity-90' : 'text-ink-muted',
                      )}
                    >
                      {n.rotulo}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className={classNames(
              'mt-3 rounded-2xl border px-4 py-3 text-[12.5px] leading-relaxed transition-colors',
              nivel ? estilosDescritor[nivel.valor] : 'border-dashed border-line bg-paper-light text-ink-muted',
            )}
          >
            {nivel ? (
              <div className="flex items-start gap-2">
                <span
                  className={classNames(
                    'mt-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide',
                    nivel.valor === 4 ? 'bg-accent-400 text-brand-950' : 'bg-white/60 text-current',
                  )}
                >
                  {nivel.rotulo}
                </span>
                <p className="flex-1">{nivel.descricao}</p>
              </div>
            ) : (
              <p>Selecione um nível acima. O descritor aparece aqui para orientar a nota e o feedback.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
