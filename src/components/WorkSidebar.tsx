import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, CircleDashed, Search, SlidersHorizontal } from 'lucide-react';
import type { StatusTrabalho } from '../types';
import { sessaoPorNumero } from '../data/event';
import { classNames, formatarNota, truncar } from '../lib/format';
import { ProgressRing } from './ProgressRing';
import { Badge } from './Badge';

interface WorkSidebarProps {
  itens: StatusTrabalho[];
  selecionadoId: string | null;
  onSelecionar: (id: string) => void;
}

type Filtro = 'todos' | 'pendentes' | 'concluidas';

export function WorkSidebar({ itens, selecionadoId, onSelecionar }: WorkSidebarProps) {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const concluidas = itens.filter((i) => i.status === 'concluida').length;
  const percentual = itens.length > 0 ? (concluidas / itens.length) * 100 : 0;

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return itens.filter((item) => {
      if (filtro === 'pendentes' && item.status === 'concluida') return false;
      if (filtro === 'concluidas' && item.status !== 'concluida') return false;
      if (!termo) return true;
      return (
        item.trabalho.codigo.toLowerCase().includes(termo) ||
        item.trabalho.titulo.toLowerCase().includes(termo) ||
        item.trabalho.apresentador.toLowerCase().includes(termo)
      );
    });
  }, [itens, busca, filtro]);

  const grupos = useMemo(() => {
    const mapa = new Map<number, StatusTrabalho[]>();
    filtrados.forEach((item) => {
      const lista = mapa.get(item.trabalho.sessao) ?? [];
      lista.push(item);
      mapa.set(item.trabalho.sessao, lista);
    });
    return [...mapa.entries()].sort((a, b) => a[0] - b[0]);
  }, [filtrados]);

  return (
    <>
      <div className="card mb-4 p-4 lg:hidden">
        <div className="flex items-center gap-3">
          <ProgressRing valor={percentual} tamanho={48} espessura={5} />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">
              Minhas avaliações
            </div>
            <div className="mt-0.5 text-[13px] font-semibold text-ink">
              {concluidas} de {itens.length} concluídas
            </div>
          </div>
        </div>
        <label className="mt-3 block">
          <span className="sr-only">Escolher trabalho</span>
          <select
            value={selecionadoId ?? ''}
            onChange={(e) => onSelecionar(e.target.value)}
            className="h-11 w-full rounded-xl border border-line bg-white px-3 text-[12.5px] font-medium text-ink outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((sessao) => {
              const lista = itens.filter((i) => i.trabalho.sessao === sessao);
              if (lista.length === 0) return null;
              return (
                <optgroup key={sessao} label={`${String(sessao).padStart(2, '0')} · ${sessaoPorNumero(sessao).nome}`}>
                  {lista.map((item) => (
                    <option key={item.trabalho.id} value={item.trabalho.id}>
                      {item.trabalho.codigo} — {truncar(item.trabalho.titulo, 62)}
                      {item.status === 'concluida' ? ' ✓' : ''}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </label>
      </div>

      <aside className="card hidden overflow-hidden lg:sticky lg:top-[88px] lg:block lg:max-h-[calc(100vh-112px)]">
        <div className="border-b border-line-soft bg-white px-4 py-4">
          <div className="flex items-center gap-3">
            <ProgressRing
              valor={percentual}
              tamanho={52}
              espessura={5}
              cor={percentual === 100 ? 'var(--color-brand-500)' : 'var(--color-accent-500)'}
            />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">
                Minhas avaliações
              </div>
              <div className="mt-0.5 font-serif text-[17px] font-semibold leading-tight text-ink">
                {concluidas} de {itens.length}
              </div>
              <div className="text-[10.5px] text-ink-muted">banners concluídos</div>
            </div>
          </div>
          <label className="relative mt-3.5 block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por código ou título"
              className="h-9 w-full rounded-xl border border-line bg-paper-light pl-9 pr-3 text-[12px] text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
            />
          </label>
          <div className="mt-2.5 grid grid-cols-3 gap-1 rounded-xl bg-paper-deep/70 p-1">
            {(
              [
                ['todos', 'Todos'],
                ['pendentes', 'Pendentes'],
                ['concluidas', 'Feitas'],
              ] as const
            ).map(([id, rotulo]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFiltro(id)}
                className={classNames(
                  'rounded-lg px-2 py-1.5 text-[10.5px] font-semibold transition',
                  filtro === id
                    ? 'bg-white text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink',
                )}
              >
                {rotulo}
              </button>
            ))}
          </div>
        </div>

        <div className="scrollbar-thin max-h-[calc(100vh-310px)] overflow-y-auto px-2 py-2">
          {grupos.length === 0 && (
            <div className="px-3 py-8 text-center">
              <SlidersHorizontal className="mx-auto h-5 w-5 text-ink-muted" />
              <p className="mt-2 text-[12px] text-ink-muted">Nenhum trabalho neste filtro.</p>
            </div>
          )}
          {grupos.map(([sessao, lista]) => {
            const s = sessaoPorNumero(sessao);
            return (
              <div key={sessao} className="mb-2">
                <div className="flex items-center gap-2 px-2 pb-1.5 pt-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-900 text-[9px] font-extrabold text-white">
                    {String(sessao).padStart(2, '0')}
                  </span>
                  <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                    {s.curto}
                  </span>
                  <span className="ml-auto text-[9.5px] font-semibold text-ink-muted">
                    {lista.filter((i) => i.status === 'concluida').length}/{lista.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {lista.map((item) => {
                    const ativo = item.trabalho.id === selecionadoId;
                    return (
                      <button
                        key={item.trabalho.id}
                        type="button"
                        onClick={() => onSelecionar(item.trabalho.id)}
                        className={classNames(
                          'group relative w-full rounded-xl border px-2.5 py-2.5 text-left transition',
                          ativo
                            ? 'border-brand-200 bg-brand-50/80'
                            : 'border-transparent hover:border-line hover:bg-paper-light',
                        )}
                      >
                        {ativo && (
                          <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-brand-600" />
                        )}
                        <div className="flex items-start gap-2 pl-1">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-bold text-brand-700">
                                {item.trabalho.codigo}
                              </span>
                              {item.status === 'concluida' ? (
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              ) : item.status === 'rascunho' ? (
                                <CircleDashed className="h-3 w-3 text-accent-500" />
                              ) : null}
                              {item.media !== null && (
                                <span className="ml-auto text-[9.5px] font-bold text-ink-soft">
                                  {formatarNota(item.media)}
                                </span>
                              )}
                            </div>
                            <p
                              className={classNames(
                                'mt-1 line-clamp-2 text-[11.5px] font-medium leading-snug',
                                ativo ? 'text-brand-900' : 'text-ink-soft',
                              )}
                            >
                              {item.trabalho.titulo}
                            </p>
                            {item.trabalho.apresentador && (
                              <p className="mt-1 truncate text-[10px] text-ink-muted">
                                {item.trabalho.apresentador}
                              </p>
                            )}
                          </div>
                          <ChevronRight
                            className={classNames(
                              'mt-1 h-3.5 w-3.5 shrink-0 transition',
                              ativo ? 'text-brand-600' : 'text-line group-hover:text-ink-muted',
                            )}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-line-soft bg-paper-light px-4 py-2.5">
          <div className="flex items-center justify-between text-[10px] text-ink-muted">
            <span className="inline-flex items-center gap-1">
              <Badge tom="brand" className="scale-90">2 avaliadores</Badge>
              por trabalho
            </span>
            <span>{percentual === 100 ? 'Tudo concluído' : 'Progresso salvo'}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
