import { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  UserRound,
  Users,
} from 'lucide-react';
import type { RankingItem } from '../types';
import { SESSOES } from '../data/event';
import { useApp } from '../context/AppContext';
import { MINIMO_AVALIACOES_POR_TRABALHO, cobertura, resumoAvaliadores } from '../lib/scoring';
import { classNames, contar, formatarPercentual, iniciais } from '../lib/format';
import { Badge } from './Badge';
import { Button } from './Button';
import { ProgressRing } from './ProgressRing';

interface CoveragePanelProps {
  ranking: RankingItem[];
  onDetalhar: (item: RankingItem) => void;
  onAbrirCuradoria: () => void;
}

export function CoveragePanel({ ranking, onDetalhar, onAbrirCuradoria }: CoveragePanelProps) {
  const { membros, atribuicoes, avaliacoes, trabalhos } = useApp();
  const cob = useMemo(() => cobertura(trabalhos, atribuicoes, avaliacoes), [trabalhos, atribuicoes, avaliacoes]);
  const resumo = useMemo(
    () => resumoAvaliadores(membros, atribuicoes, avaliacoes),
    [membros, atribuicoes, avaliacoes],
  );
  const semAtribuicao = trabalhos.filter(
    (t) => !atribuicoes.some((a) => a.trabalhoId === t.id),
  ).length;
  const concluidas = avaliacoes.filter((a) => a.concluida).length;
  const rascunhos = avaliacoes.filter((a) => !a.concluida).length;

  const porSessao = SESSOES.map((sessao) => {
    const itens = ranking.filter((i) => i.trabalho.sessao === sessao.numero);
    const cobertos = itens.filter((i) => i.concluidas >= MINIMO_AVALIACOES_POR_TRABALHO).length;
    const comUma = itens.filter((i) => i.concluidas === 1).length;
    return {
      sessao,
      total: itens.length,
      cobertos,
      comUma,
      restantes: Math.max(0, itens.length - cobertos - comUma),
    };
  });

  return (
    <div className="space-y-4">
      <section className="card overflow-hidden">
        <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <div className="flex shrink-0 items-center justify-center">
            <ProgressRing
              valor={cob.percentual}
              tamanho={104}
              espessura={9}
              cor={cob.percentual === 100 ? 'var(--color-emerald-500)' : 'var(--color-accent-500)'}
              rotulo={`${Math.round(cob.percentual)}% dos trabalhos com cobertura mínima`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="eyebrow">Cobertura da avaliação</div>
            <h2 className="mt-1 display text-[23px] font-semibold leading-tight text-ink sm:text-[27px]">
              {cob.comMinimo} de {cob.total} trabalhos com cobertura mínima
            </h2>
            <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-ink-muted">
              A comissão definiu {MINIMO_AVALIACOES_POR_TRABALHO} avaliações concluídas por trabalho
              (ou todas as atribuições, quando há menos). Rascunhos não contam.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tom={cob.semAvaliacao > 0 ? 'rose' : 'green'} ponto>
                {cob.semAvaliacao} sem nenhuma avaliação
              </Badge>
              <Badge tom={semAtribuicao > 0 ? 'amber' : 'green'} ponto>
                {semAtribuicao} sem atribuição
              </Badge>
              <Badge tom="neutral" ponto>
                {contar(concluidas, 'concluída', 'concluídas')} · {contar(rascunhos, 'rascunho', 'rascunhos')}
              </Badge>
            </div>
          </div>
          <div className="shrink-0">
            <Button
              variante="secondary"
              onClick={onAbrirCuradoria}
              icone={<Users className="h-4 w-4" />}
            >
              Ajustar distribuição
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-line-soft px-5 py-3.5">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-brand-600" />
              <h3 className="font-serif text-[16px] font-semibold text-ink">Progresso por avaliador</h3>
            </div>
            <Badge tom="neutral">{resumo.length} membros ativos</Badge>
          </div>
          <div className="divide-y divide-line-soft/70">
            {resumo.map((r) => (
              <div key={r.membro.id} className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={classNames(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold',
                      r.membro.papel === 'presidente'
                        ? 'bg-brand-800 text-white'
                        : 'bg-brand-50 text-brand-700',
                    )}
                  >
                    {iniciais(r.membro.nome)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[12px] font-semibold text-ink">{r.membro.nome}</span>
                      {r.membro.papel === 'presidente' && (
                        <Badge tom="brand" className="scale-90">presidência</Badge>
                      )}
                    </div>
                    <div className="text-[9.5px] text-ink-muted">
                      {contar(r.atribuidas, 'atribuída', 'atribuídas')} · {contar(r.concluidas, 'concluída', 'concluídas')} · {contar(r.rascunhos, 'rascunho', 'rascunhos')}
                    </div>
                  </div>
                  <span
                    className={classNames(
                      'shrink-0 text-[11px] font-bold',
                      r.percentual === 100 ? 'text-emerald-600' : r.percentual > 0 ? 'text-accent-600' : 'text-ink-muted',
                    )}
                  >
                    {formatarPercentual(r.percentual)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-deep">
                  <div
                    className={classNames(
                      'h-full rounded-full transition-all',
                      r.percentual === 100 ? 'bg-emerald-500' : 'bg-brand-500',
                    )}
                    style={{ width: `${Math.min(100, r.percentual)}%` }}
                  />
                </div>
              </div>
            ))}
            {resumo.length === 0 && (
              <p className="px-5 py-8 text-center text-[12px] text-ink-muted">
                Nenhum avaliador ativo cadastrado.
              </p>
            )}
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-line-soft px-5 py-3.5">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-brand-600" />
              <h3 className="font-serif text-[16px] font-semibold text-ink">Distribuição por sessão</h3>
            </div>
            <div className="flex items-center gap-2 text-[9px] text-ink-muted">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> coberto
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-accent-400" /> 1 avaliação
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-paper-deep" /> sem
              </span>
            </div>
          </div>
          <div className="space-y-3 px-5 py-4">
            {porSessao.map(({ sessao, total, cobertos, comUma, restantes }) => (
              <div key={sessao.numero}>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-ink-soft">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: sessao.cor }}
                    />
                    <span className="truncate">
                      {String(sessao.numero).padStart(2, '0')} · {sessao.curto}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] font-semibold text-ink-muted">
                    {cobertos}/{total}
                  </span>
                </div>
                <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-paper-deep">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: total ? `${(cobertos / total) * 100}%` : '0%' }}
                  />
                  <div
                    className="h-full bg-accent-400"
                    style={{ width: total ? `${(comUma / total) * 100}%` : '0%' }}
                  />
                  <div
                    className="h-full bg-paper-deep"
                    style={{ width: total ? `${(restantes / total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft px-5 py-3.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-accent-600" />
            <h3 className="font-serif text-[16px] font-semibold text-ink">Trabalhos com pendência</h3>
          </div>
          <Badge tom={cob.incompletos.length > 0 ? 'amber' : 'green'} ponto>
            {cob.incompletos.length} de {cob.total}
          </Badge>
        </div>

        {cob.incompletos.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <p className="mt-2 font-serif text-[17px] font-semibold text-ink">Cobertura completa</p>
            <p className="mt-1 text-[11.5px] text-ink-muted">
              Todos os trabalhos têm o mínimo de {MINIMO_AVALIACOES_POR_TRABALHO} avaliações concluídas.
            </p>
          </div>
        ) : (
          <div className="scrollbar-thin max-h-[420px] divide-y divide-line-soft/70 overflow-y-auto">
            {cob.incompletos.map((trabalho) => {
              const item = ranking.find((i) => i.trabalho.id === trabalho.id);
              if (!item) return null;
              const status =
                item.atribuidas === 0
                  ? 'sem atribuição'
                  : item.concluidas === 0
                    ? 'aguardando'
                    : `${item.concluidas}/${item.atribuidas}`;
              return (
                <div key={trabalho.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="font-mono text-[10px] font-bold text-brand-700">{trabalho.codigo}</span>
                  <span className="min-w-0 flex-1 truncate text-[11.5px] text-ink-soft" title={trabalho.titulo}>
                    {trabalho.titulo}
                  </span>
                  <Badge tom={item.atribuidas === 0 ? 'rose' : 'amber'} className="shrink-0">
                    {status}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => onDetalhar(item)}
                    className="shrink-0 rounded-lg p-1.5 text-ink-muted transition hover:bg-brand-50 hover:text-brand-700"
                    aria-label={`Ver ${trabalho.codigo}`}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
