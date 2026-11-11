import { CRITERIOS, rotuloNota } from '../data/rubric';
import { classNames, contar, formatarNota } from '../lib/format';
import { Badge } from './Badge';

interface ScoreOverviewProps {
  notas: Record<string, number>;
  notaFinal: number;
  respondidos: number;
  concluida?: boolean;
}

export function ScoreOverview({ notas, notaFinal, respondidos, concluida }: ScoreOverviewProps) {
  const completa = respondidos === CRITERIOS.length;
  const rotulo = rotuloNota(notaFinal);
  const tom =
    notaFinal >= 90 ? 'brand' : notaFinal >= 75 ? 'green' : notaFinal >= 60 ? 'amber' : 'neutral';

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line-soft bg-gradient-to-br from-brand-950 to-brand-800 px-5 py-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-brand-300">
              {concluida ? 'Nota final' : 'Nota parcial'}
            </div>
            <div className="mt-1 flex items-end gap-1.5">
              <span className="display text-[46px] font-semibold leading-none tracking-tight">
                {formatarNota(notaFinal, Number.isInteger(notaFinal) ? 0 : 1)}
              </span>
              <span className="pb-1 text-[13px] font-medium text-brand-300">/ 100</span>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10">
            <span className="display text-[17px] font-semibold text-accent-400">
              {respondidos}/5
            </span>
          </div>
        </div>
        <div className="mt-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-accent-400 transition-all duration-500"
              style={{ width: `${Math.min(100, notaFinal)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-brand-200">{rotulo}</span>
            <span className="text-[10px] text-brand-300">
              {completa ? 'Régua completa' : contar(CRITERIOS.length - respondidos, 'critério restante', 'critérios restantes')}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="space-y-3">
          {CRITERIOS.map((criterio) => {
            const valor = notas[String(criterio.id)];
            const preenchido = Number.isInteger(valor) && valor >= 0 && valor <= 4;
            return (
              <div key={criterio.id}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[10.5px] font-medium text-ink-soft">
                    {criterio.titulo}
                  </span>
                  <span
                    className={classNames(
                      'shrink-0 text-[10px] font-bold',
                      preenchido ? 'text-ink' : 'text-ink-muted',
                    )}
                  >
                    {preenchido ? `${valor * 5}/20` : '—'}
                  </span>
                </div>
                <div className="mt-1 flex gap-1">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <span
                      key={n}
                      className={classNames(
                        'h-1.5 flex-1 rounded-full transition-colors',
                        preenchido && n <= valor
                          ? n === 4
                            ? 'bg-accent-500'
                            : 'bg-brand-600'
                          : 'bg-paper-deep',
                      )}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl bg-paper-light px-3 py-2.5">
          <p className="text-[10.5px] leading-relaxed text-ink-muted">
            A nota é a soma dos níveis (0 a 4) × 5. Cada critério vale 20 pontos.
          </p>
        </div>
        {notaFinal >= 60 ? (
          <div className="mt-3 flex items-center justify-between">
            <Badge tom={tom} ponto>
              {rotulo}
            </Badge>
            <span className="text-[9.5px] text-ink-muted">corte formativo: 60</span>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between">
            <Badge tom="neutral" ponto>
              {rotulo}
            </Badge>
            <span className="text-[9.5px] text-ink-muted">abaixo de 60</span>
          </div>
        )}
      </div>
    </div>
  );
}
