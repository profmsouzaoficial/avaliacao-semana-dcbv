import { useMemo, useState } from 'react';
import { Award, ChevronRight, Filter, Search, X } from 'lucide-react';
import type { RankingItem } from '../types';
import { CRITERIOS, rotuloNota } from '../data/rubric';
import { SESSOES, sessaoPorNumero } from '../data/event';
import { classNames, contar, formatarNota, truncar } from '../lib/format';
import { Badge } from './Badge';

interface RankingTableProps {
  ranking: RankingItem[];
  onDetalhar: (item: RankingItem) => void;
}

export function RankingTable({ ranking, onDetalhar }: RankingTableProps) {
  const [busca, setBusca] = useState('');
  const [sessao, setSessao] = useState<number | 'todas'>('todas');
  const [apenasAvaliados, setApenasAvaliados] = useState(false);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return ranking.filter((item) => {
      if (sessao !== 'todas' && item.trabalho.sessao !== sessao) return false;
      if (apenasAvaliados && item.media === null) return false;
      if (!termo) return true;
      return (
        item.trabalho.codigo.toLowerCase().includes(termo) ||
        item.trabalho.titulo.toLowerCase().includes(termo) ||
        item.trabalho.apresentador.toLowerCase().includes(termo) ||
        item.trabalho.autores.toLowerCase().includes(termo)
      );
    });
  }, [ranking, busca, sessao, apenasAvaliados]);

  const temFiltro = busca.trim().length > 0 || sessao !== 'todas' || apenasAvaliados;
  const limpar = () => {
    setBusca('');
    setSessao('todas');
    setApenasAvaliados(false);
  };

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line-soft bg-white px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-brand-600" />
              <h2 className="font-serif text-[19px] font-semibold text-ink">Ranking consolidado</h2>
            </div>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-muted">
              Média das avaliações concluídas. Empates são resolvidos pelos critérios 4, 5, 1, 2 e 3,
              nesta ordem; persistindo, pela ordem do código.
            </p>
          </div>
          <Badge tom="brand">{contar(filtrados.length, 'trabalho', 'trabalhos')}</Badge>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <label className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por código, título ou autor"
              className="h-9 w-full rounded-xl border border-line bg-paper-light pl-9 pr-3 text-[12px] text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
            />
          </label>
          <select
            value={sessao}
            onChange={(e) => setSessao(e.target.value === 'todas' ? 'todas' : Number(e.target.value))}
            className="h-9 rounded-xl border border-line bg-paper-light px-2.5 text-[11.5px] font-medium text-ink-soft outline-none focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
          >
            <option value="todas">Todas as sessões</option>
            {SESSOES.map((s) => (
              <option key={s.numero} value={s.numero}>
                {String(s.numero).padStart(2, '0')} · {s.curto}
              </option>
            ))}
          </select>
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-line bg-paper-light px-3 text-[11px] font-medium text-ink-soft">
            <input
              type="checkbox"
              checked={apenasAvaliados}
              onChange={(e) => setApenasAvaliados(e.target.checked)}
              className="h-3.5 w-3.5 accent-brand-700"
            />
            Só com avaliação
          </label>
          {temFiltro && (
            <button
              type="button"
              onClick={limpar}
              className="inline-flex h-9 items-center gap-1 rounded-xl px-2 text-[11px] font-semibold text-brand-700 hover:bg-brand-50"
            >
              <X className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line-soft bg-paper-light/70 text-[9px] font-bold uppercase tracking-[0.1em] text-ink-muted">
              <th className="w-12 px-3 py-2.5 text-center">#</th>
              <th className="px-3 py-2.5">Trabalho</th>
              <th className="w-24 px-3 py-2.5">Sessão</th>
              <th className="w-20 px-3 py-2.5 text-center">Avaliações</th>
              <th className="w-24 px-3 py-2.5 text-right">Média</th>
              <th className="w-28 px-3 py-2.5 text-center">Critérios</th>
              <th className="w-16 px-3 py-2.5 text-center">Menção</th>
              <th className="w-10 px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtrados.map((item) => {
              const s = sessaoPorNumero(item.trabalho.sessao);
              return (
                <tr
                  key={item.trabalho.id}
                  className="group border-b border-line-soft/70 last:border-0 hover:bg-brand-50/30"
                >
                  <td className="px-3 py-3 text-center">
                    <Posicao posicao={item.posicao} />
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => onDetalhar(item)}
                      className="block w-full text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-brand-700">
                          {item.trabalho.codigo}
                        </span>
                        {item.elegivelDestaqueFormativo && (
                          <Badge tom="amber" className="scale-90">
                            destaque formativo
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 line-clamp-2 max-w-[460px] text-[12px] font-medium leading-snug text-ink group-hover:text-brand-900">
                        {item.trabalho.titulo}
                      </div>
                      {item.trabalho.apresentador && (
                        <div className="mt-0.5 truncate text-[10px] text-ink-muted">
                          {item.trabalho.apresentador}
                        </div>
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-ink-soft">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: s.cor }}
                      />
                      {s.curto}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={classNames(
                        'text-[11px] font-semibold',
                        item.concluidas >= 2
                          ? 'text-emerald-600'
                          : item.concluidas > 0
                            ? 'text-accent-600'
                            : 'text-ink-muted',
                      )}
                    >
                      {item.concluidas}
                      <span className="font-normal text-ink-muted">/{item.atribuidas || 0}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {item.media !== null ? (
                      <div>
                        <span className="text-[14px] font-bold text-ink">{formatarNota(item.media, 1)}</span>
                        <span className="text-[9px] text-ink-muted">/100</span>
                        <div className="text-[8.5px] font-medium text-ink-muted">{rotuloNota(item.media)}</div>
                      </div>
                    ) : (
                      <span className="text-[11px] text-ink-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <CriterionBars item={item} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    {item.votosMencao > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-accent-700">
                        <Award className="h-3.5 w-3.5" /> {item.votosMencao}
                      </span>
                    ) : (
                      <span className="text-[10px] text-ink-muted">—</span>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <button
                      type="button"
                      onClick={() => onDetalhar(item)}
                      className="rounded-lg p-1.5 text-ink-muted transition hover:bg-brand-50 hover:text-brand-700"
                      aria-label={`Ver detalhes de ${item.trabalho.codigo}`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center">
                  <p className="text-[13px] font-medium text-ink-soft">Nenhum trabalho encontrado.</p>
                  <p className="mt-1 text-[11.5px] text-ink-muted">
                    Ajuste a busca, a sessão ou o filtro de avaliação.
                  </p>
                  {temFiltro && (
                    <button
                      type="button"
                      onClick={limpar}
                      className="mt-3 text-[11.5px] font-semibold text-brand-700 underline underline-offset-2"
                    >
                      Limpar filtros
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-line-soft md:hidden">
        {filtrados.map((item) => {
          const s = sessaoPorNumero(item.trabalho.sessao);
          return (
            <button
              key={item.trabalho.id}
              type="button"
              onClick={() => onDetalhar(item)}
              className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-brand-50/30"
            >
              <Posicao posicao={item.posicao} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-brand-700">{item.trabalho.codigo}</span>
                  <span className="truncate text-[10px] text-ink-muted">{s.curto}</span>
                  {item.votosMencao > 0 && (
                    <span className="ml-auto inline-flex items-center gap-0.5 text-[10px] font-bold text-accent-700">
                      <Award className="h-3 w-3" /> {item.votosMencao}
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-snug text-ink">
                  {item.trabalho.titulo}
                </p>
                <div className="mt-1.5 flex items-center gap-2 text-[10px]">
                  <span
                    className={classNames(
                      'font-semibold',
                      item.media !== null ? 'text-ink' : 'text-ink-muted',
                    )}
                  >
                    {item.media !== null ? `${formatarNota(item.media, 1)}/100` : 'sem avaliação'}
                  </span>
                  <span className="text-ink-muted">·</span>
                  <span className="text-ink-muted">
                    {item.concluidas}/{item.atribuidas || 0} avaliações
                  </span>
                  {item.media !== null && (
                    <span className="ml-auto text-[9px] font-medium text-ink-muted">
                      {rotuloNota(item.media)}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-ink-muted" />
            </button>
          );
        })}
        {filtrados.length === 0 && (
          <div className="px-5 py-10 text-center">
            <p className="text-[12.5px] text-ink-soft">Nenhum trabalho encontrado.</p>
            {temFiltro && (
              <button
                type="button"
                onClick={limpar}
                className="mt-2 text-[11px] font-semibold text-brand-700 underline underline-offset-2"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft bg-paper-light px-4 py-2.5 text-[9.5px] text-ink-muted sm:px-5">
        <span>
          Critérios: {CRITERIOS.map((c) => `${c.id} = ${truncar(c.titulo, 22)}`).join(' · ')}
        </span>
        <span className="font-medium">
          Rascunhos não entram na média · mínimo de 2 avaliações para cobertura
        </span>
      </div>
    </div>
  );
}

function Posicao({ posicao }: { posicao: number | null }) {
  const estilo =
    posicao === 1
      ? 'bg-accent-400 text-brand-950'
      : posicao === 2
        ? 'bg-brand-200 text-brand-900'
        : posicao === 3
          ? 'bg-accent-100 text-accent-700'
          : 'bg-paper-deep text-ink-muted';
  return (
    <span
      className={classNames(
        'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold',
        estilo,
      )}
      title={posicao ? `${posicao}º lugar` : 'Sem avaliação'}
    >
      {posicao ?? '—'}
    </span>
  );
}

function CriterionBars({ item }: { item: RankingItem }) {
  return (
    <div className="flex items-end justify-center gap-1.5">
      {CRITERIOS.map((criterio) => {
        const valor = item.mediasPorCriterio[criterio.id];
        const altura = valor !== null ? Math.max(8, (valor / 20) * 100) : 8;
        return (
          <div
            key={criterio.id}
            className="flex w-3 flex-col items-center gap-0.5"
            title={`${criterio.titulo}: ${valor !== null ? `${formatarNota(valor, 1)}/20` : 'sem avaliação'}`}
          >
            <div className="flex h-6 w-1.5 items-end overflow-hidden rounded-full bg-paper-deep">
              <div
                className={classNames(
                  'w-full rounded-full',
                  valor === null
                    ? 'bg-transparent'
                    : criterio.id === 4
                      ? 'bg-accent-500'
                      : 'bg-brand-500',
                )}
                style={{ height: `${altura}%` }}
              />
            </div>
            <span className="text-[7px] font-semibold text-ink-muted">{criterio.id}</span>
          </div>
        );
      })}
    </div>
  );
}
