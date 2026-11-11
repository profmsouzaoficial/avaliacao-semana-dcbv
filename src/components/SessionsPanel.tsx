import { Award, ChevronRight, Clock3, Sparkles } from 'lucide-react';
import type { RankingItem } from '../types';
import { SESSOES } from '../data/event';
import { vencedoresPorSessao } from '../lib/scoring';
import { classNames, contar, formatarNota } from '../lib/format';
import { Badge } from './Badge';

interface SessionsPanelProps {
  ranking: RankingItem[];
  onDetalhar: (item: RankingItem) => void;
  onAbrirCuradoria: () => void;
}

export function SessionsPanel({ ranking, onDetalhar, onAbrirCuradoria }: SessionsPanelProps) {
  const vencedores = vencedoresPorSessao(ranking);
  const sessoesComAvaliacao = SESSOES.filter((s) =>
    ranking.some((i) => i.trabalho.sessao === s.numero && i.concluidas > 0),
  ).length;
  const elegiveis = ranking.filter((i) => i.elegivelDestaqueFormativo);

  return (
    <div className="space-y-4">
      <div className="hero-mesh relative overflow-hidden rounded-3xl px-5 py-5 text-white sm:px-6 sm:py-6">
        <div className="hero-grid absolute inset-0 opacity-60" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[9.5px] font-bold uppercase tracking-[0.16em] text-brand-100">
              <Award className="h-3 w-3 text-accent-400" />
              Menções honrosas
            </div>
            <h2 className="display mt-2.5 text-[25px] font-semibold leading-tight sm:text-[30px]">
              Uma por sessão temática
            </h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-brand-200">
              Prévia calculada pela média das avaliações concluídas. O Regulamento (item 7.2) prevê a
              menção ao melhor trabalho de cada sessão; a decisão final é da Comissão Científica.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="rounded-2xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5">
              <div className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-brand-300">
                Sessões com avaliação
              </div>
              <div className="mt-0.5 display text-[24px] font-semibold leading-none">
                {sessoesComAvaliacao}
                <span className="text-[13px] text-brand-300">/7</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5">
              <div className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-brand-300">
                Destaques formativos
              </div>
              <div className="mt-0.5 display text-[24px] font-semibold leading-none text-accent-400">
                {elegiveis.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SESSOES.map((sessao) => {
          const daSessao = ranking.filter((i) => i.trabalho.sessao === sessao.numero);
          const vencedor = vencedores[sessao.numero];
          const cobertos = daSessao.filter((i) => i.concluidas >= 2).length;
          const outros = daSessao
            .filter((i) => i.media !== null && i.trabalho.id !== vencedor?.trabalho.id)
            .slice(0, 3);

          return (
            <section key={sessao.numero} className="card overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-line-soft px-4 py-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-900 text-[10px] font-extrabold text-white">
                  {String(sessao.numero).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-serif text-[15px] font-semibold text-ink">{sessao.nome}</h3>
                  <p className="text-[9.5px] text-ink-muted">
                    {contar(daSessao.length, 'trabalho', 'trabalhos')} · {cobertos} com cobertura
                  </p>
                </div>
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: sessao.cor }}
                  aria-hidden
                />
              </div>

              <div className="px-4 py-3">
                {vencedor ? (
                  <div className="rounded-2xl border border-accent-200 bg-accent-50/80 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-accent-700">
                        <Award className="h-3 w-3" />
                        Prévia da menção
                      </span>
                      <div className="text-right">
                        <span className="text-[16px] font-extrabold leading-none text-accent-800">
                          {formatarNota(vencedor.media ?? 0, 1)}
                        </span>
                        <span className="text-[8.5px] text-accent-700">/100</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDetalhar(vencedor)}
                      className="mt-2 block w-full text-left"
                    >
                      <div className="font-mono text-[9.5px] font-bold text-accent-700">
                        {vencedor.trabalho.codigo}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-snug text-accent-900 hover:underline">
                        {vencedor.trabalho.titulo}
                      </p>
                    </button>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge tom={vencedor.concluidas >= 2 ? 'green' : 'amber'} className="scale-90">
                        {vencedor.concluidas >= 2
                          ? `${vencedor.concluidas} avaliações`
                          : 'cobertura parcial'}
                      </Badge>
                      {vencedor.elegivelDestaqueFormativo && (
                        <Badge tom="brand" className="scale-90">
                          destaque formativo
                        </Badge>
                      )}
                      {vencedor.votosMencao > 0 && (
                        <Badge tom="amber" className="scale-90">
                          {contar(vencedor.votosMencao, 'indicação', 'indicações')}
                        </Badge>
                      )}
                    </div>
                    {vencedor.concluidas < 2 && (
                      <p className="mt-2 text-[9.5px] leading-snug text-accent-700/80">
                        A prévia usa 1 avaliação. A cobertura mínima é de 2.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-paper-light px-3 py-6 text-center">
                    <Clock3 className="h-5 w-5 text-ink-muted" />
                    <p className="mt-1.5 text-[11.5px] font-semibold text-ink-soft">Aguardando avaliações</p>
                    <p className="mt-0.5 text-[10px] text-ink-muted">
                      {contar(daSessao.length, 'trabalho', 'trabalhos')} nesta sessão
                    </p>
                  </div>
                )}

                {outros.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[8.5px] font-bold uppercase tracking-[0.13em] text-ink-muted">
                      Na sequência
                    </div>
                    <div className="mt-1.5 space-y-1">
                      {outros.map((item) => (
                        <button
                          key={item.trabalho.id}
                          type="button"
                          onClick={() => onDetalhar(item)}
                          className="group flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition hover:bg-brand-50"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-paper-deep text-[9px] font-bold text-ink-muted">
                            {item.posicao ?? '—'}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[10.5px] text-ink-soft group-hover:text-ink">
                            {item.trabalho.codigo} · {item.trabalho.titulo}
                          </span>
                          <span className="shrink-0 text-[9.5px] font-bold text-ink-soft">
                            {formatarNota(item.media ?? 0, 1)}
                          </span>
                          <ChevronRight className="h-3 w-3 shrink-0 text-line group-hover:text-ink-muted" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line-soft px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-serif text-[18px] font-semibold text-ink">Destaque formativo</h3>
                <Badge tom="amber">sugestão pedagógica</Badge>
              </div>
              <p className="mt-1 max-w-2xl text-[11.5px] leading-relaxed text-ink-muted">
                Reconhecimento simbólico para estudantes de graduação nos períodos iniciais (1º a 4º)
                que alcançaram média de pelo menos 15/20 no critério 4 — o diálogo entre ciências
                básicas e formação em saúde. Não é uma categoria oficial do Regulamento; é uma
                sugestão para a comissão valorizar quem está começando a fazer ciência.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onAbrirCuradoria}
            className="text-[11px] font-semibold text-brand-700 underline decoration-brand-200 underline-offset-2 hover:text-brand-900"
          >
            Completar dados na Curadoria
          </button>
        </div>

        {elegiveis.length > 0 ? (
          <div className="grid gap-2 px-5 py-4 sm:grid-cols-2 xl:grid-cols-3">
            {elegiveis.slice(0, 6).map((item) => (
              <button
                key={item.trabalho.id}
                type="button"
                onClick={() => onDetalhar(item)}
                className="group rounded-2xl border border-line bg-white p-3 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[9.5px] font-bold text-brand-700">
                    {item.trabalho.codigo}
                  </span>
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[9px] font-semibold text-brand-800">
                    {item.trabalho.periodo || 'graduação'}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[11.5px] font-medium leading-snug text-ink">
                  {item.trabalho.titulo}
                </p>
                <div className="mt-2 flex items-center justify-between text-[9.5px] text-ink-muted">
                  <span>Critério 4: {formatarNota(item.mediasPorCriterio[4] ?? 0, 1)}/20</span>
                  <span className={classNames('font-bold', item.media !== null ? 'text-ink' : '')}>
                    {item.media !== null ? `${formatarNota(item.media, 1)}/100` : '—'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="px-5 py-5">
            <p className="text-[11.5px] leading-relaxed text-ink-muted">
              Ainda não há trabalhos elegíveis com os dados atuais. O parecer de aprovação não traz
              nível e período dos autores; complete esses campos na Curadoria para habilitar a
              sugestão. A elegibilidade exige: graduação, período 1º–4º e média ≥ 15/20 no critério 4.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
