import { useMemo, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { Trabalho } from '../types';
import { CATEGORIAS, SESSOES, categoriaPorNumero, sessaoPorNumero } from '../data/event';
import { useApp } from '../context/AppContext';
import { contar } from '../lib/format';
import { Badge } from './Badge';
import { Button } from './Button';

interface WorksPanelProps {
  onNovo: () => void;
  onEditar: (trabalho: Trabalho) => void;
  onExcluir: (trabalho: Trabalho) => void;
  onImportar: () => void;
  onExportar: () => void;
  onModelo: () => void;
}

export function WorksPanel({
  onNovo,
  onEditar,
  onExcluir,
  onImportar,
  onExportar,
  onModelo,
}: WorksPanelProps) {
  const { trabalhos, atribuicoes, avaliacoes } = useApp();
  const [busca, setBusca] = useState('');
  const [sessaoFiltro, setSessaoFiltro] = useState<'todas' | number>('todas');
  const [categoriaFiltro, setCategoriaFiltro] = useState<'todas' | number>('todas');

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return trabalhos
      .filter((t) => (sessaoFiltro === 'todas' ? true : t.sessao === sessaoFiltro))
      .filter((t) => (categoriaFiltro === 'todas' ? true : t.categoria === categoriaFiltro))
      .filter(
        (t) =>
          !termo ||
          t.codigo.toLowerCase().includes(termo) ||
          t.titulo.toLowerCase().includes(termo) ||
          t.apresentador.toLowerCase().includes(termo),
      )
      .sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [trabalhos, busca, sessaoFiltro, categoriaFiltro]);

  const semAtribuicao = trabalhos.filter((t) => !atribuicoes.some((a) => a.trabalhoId === t.id)).length;
  const comAvaliacao = trabalhos.filter((t) =>
    avaliacoes.some((a) => a.trabalhoId === t.id && a.concluida),
  ).length;
  const temFiltro = busca.trim().length > 0 || sessaoFiltro !== 'todas' || categoriaFiltro !== 'todas';

  const limparFiltros = () => {
    setBusca('');
    setSessaoFiltro('todas');
    setCategoriaFiltro('todas');
  };

  return (
    <div className="space-y-3">
      <div className="card px-4 py-3.5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por código, título ou apresentador"
                className="h-9 w-full rounded-xl border border-line bg-paper-light pl-9 pr-8 text-[11.5px] text-ink outline-none placeholder:text-ink-muted/70 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-muted hover:text-ink"
                  aria-label="Limpar busca"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
              <select
                value={sessaoFiltro}
                onChange={(e) =>
                  setSessaoFiltro(e.target.value === 'todas' ? 'todas' : Number(e.target.value))
                }
                className="h-9 w-full appearance-none rounded-xl border border-line bg-paper-light pl-8 pr-8 text-[11px] text-ink outline-none focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100 sm:w-[210px]"
              >
                <option value="todas">Todas as sessões</option>
                {SESSOES.map((s) => (
                  <option key={s.numero} value={s.numero}>
                    {String(s.numero).padStart(2, '0')} · {s.curto}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={categoriaFiltro}
              onChange={(e) =>
                setCategoriaFiltro(e.target.value === 'todas' ? 'todas' : Number(e.target.value))
              }
              className="h-9 w-full rounded-xl border border-line bg-paper-light px-2.5 text-[11px] text-ink outline-none focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100 sm:w-[230px]"
            >
              <option value="todas">Todas as categorias</option>
              {CATEGORIAS.map((c) => (
                <option key={c.numero} value={c.numero}>
                  {c.numero} · {c.curto}
                </option>
              ))}
            </select>
            {temFiltro && (
              <button
                type="button"
                onClick={limparFiltros}
                className="inline-flex h-9 items-center gap-1 rounded-xl px-2 text-[10.5px] font-semibold text-ink-muted hover:bg-paper hover:text-ink"
              >
                <X className="h-3 w-3" /> limpar
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variante="primary" tamanho="sm" onClick={onNovo} icone={<Plus className="h-3.5 w-3.5" />}>
              Novo trabalho
            </Button>
            <Button variante="secondary" tamanho="sm" onClick={onImportar} icone={<Upload className="h-3.5 w-3.5" />}>
              Importar CSV
            </Button>
            <Button variante="secondary" tamanho="sm" onClick={onExportar} icone={<Download className="h-3.5 w-3.5" />}>
              Exportar
            </Button>
            <Button variante="ghost" tamanho="sm" onClick={onModelo} icone={<FileSpreadsheet className="h-3.5 w-3.5" />}>
              Modelo
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line-soft pt-2.5">
          <Badge tom="neutral">{contar(trabalhos.length, 'trabalho cadastrado', 'trabalhos cadastrados')}</Badge>
          <Badge tom={comAvaliacao > 0 ? 'green' : 'neutral'} ponto>
            {comAvaliacao} com avaliação concluída
          </Badge>
          <Badge tom={semAtribuicao > 0 ? 'amber' : 'green'} ponto>
            {semAtribuicao} sem atribuição
          </Badge>
          <span className="text-[10px] text-ink-muted">
            {filtrados.length !== trabalhos.length
              ? `mostrando ${filtrados.length} de ${trabalhos.length}`
              : 'ordem por código'}
          </span>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="card px-5 py-12 text-center">
          <FileSpreadsheet className="mx-auto h-8 w-8 text-ink-muted" />
          <p className="mt-2 font-serif text-[18px] font-semibold text-ink">
            {trabalhos.length === 0 ? 'Nenhum trabalho cadastrado' : 'Nenhum resultado'}
          </p>
          <p className="mt-1 text-[11.5px] text-ink-muted">
            {trabalhos.length === 0
              ? 'Importe a lista do parecer em CSV ou cadastre o primeiro trabalho.'
              : 'Ajuste a busca ou limpe os filtros para ver todos os trabalhos.'}
          </p>
          <div className="mt-3 flex justify-center gap-2">
            {trabalhos.length === 0 ? (
              <>
                <Button variante="primary" tamanho="sm" onClick={onImportar} icone={<Upload className="h-3.5 w-3.5" />}>
                  Importar CSV
                </Button>
                <Button variante="secondary" tamanho="sm" onClick={onNovo} icone={<Plus className="h-3.5 w-3.5" />}>
                  Cadastrar manualmente
                </Button>
              </>
            ) : (
              <Button variante="secondary" tamanho="sm" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="card hidden overflow-hidden md:block">
            <div className="scrollbar-thin max-h-[660px] overflow-auto">
              <table className="w-full min-w-[920px] border-collapse">
                <thead className="sticky top-0 z-10 bg-paper-light">
                  <tr className="border-b border-line-soft">
                    <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                      Trabalho
                    </th>
                    <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                      Sessão
                    </th>
                    <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                      Categoria
                    </th>
                    <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                      Apresentação
                    </th>
                    <th className="px-3 py-2.5 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                      Avaliações
                    </th>
                    <th className="px-3 py-2.5 text-right text-[9px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((trabalho) => {
                    const atribuidas = atribuicoes.filter((a) => a.trabalhoId === trabalho.id).length;
                    const concluidas = avaliacoes.filter(
                      (a) => a.trabalhoId === trabalho.id && a.concluida,
                    ).length;
                    const sessao = sessaoPorNumero(trabalho.sessao);
                    const categoria = categoriaPorNumero(trabalho.categoria);
                    return (
                      <tr key={trabalho.id} className="group border-b border-line-soft/70 transition hover:bg-brand-50/30">
                        <td className="max-w-[420px] px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-brand-700">{trabalho.codigo}</span>
                            {trabalho.nivel !== 'outro' && (
                              <Badge tom={trabalho.nivel === 'graduacao' ? 'brand' : 'neutral'} className="scale-90">
                                {trabalho.nivel === 'graduacao'
                                  ? 'graduação'
                                  : trabalho.nivel === 'pos-graduacao'
                                    ? 'pós'
                                    : 'docência'}
                              </Badge>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => onEditar(trabalho)}
                            className="mt-0.5 block max-w-full truncate text-left text-[11.5px] font-medium text-ink hover:underline"
                            title={trabalho.titulo}
                          >
                            {trabalho.titulo}
                          </button>
                          <div className="mt-0.5 truncate text-[9px] text-ink-muted">
                            {trabalho.apresentador || 'apresentador(a) não informado'}
                            {trabalho.periodo ? ` · ${trabalho.periodo}` : ''}
                            {trabalho.instituicao ? ` · ${trabalho.instituicao}` : ''}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5 text-[10px] text-ink-soft">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: sessao.cor }} />
                            {String(sessao.numero).padStart(2, '0')} · {sessao.curto}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="max-w-[150px] text-[10px] leading-snug text-ink-soft">{categoria.curto}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-[10px] text-ink-soft">{trabalho.orientador || '—'}</div>
                          <div className="text-[9px] text-ink-muted">{trabalho.autores ? 'autoria informada' : 'autoria não informada'}</div>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="inline-flex flex-col items-center gap-0.5">
                            <Badge
                              tom={atribuidas === 0 ? 'rose' : atribuidas === 1 ? 'amber' : 'green'}
                              className="scale-90"
                            >
                              {contar(atribuidas, 'atribuída', 'atribuídas')}
                            </Badge>
                            <span className="text-[8.5px] text-ink-muted">{contar(concluidas, 'concluída', 'concluídas')}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onEditar(trabalho)}
                              className="rounded-lg p-1.5 text-ink-muted transition hover:bg-white hover:text-brand-700"
                              aria-label={`Editar ${trabalho.codigo}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onExcluir(trabalho)}
                              className="rounded-lg p-1.5 text-ink-muted transition hover:bg-rose-100 hover:text-rose-600"
                              aria-label={`Excluir ${trabalho.codigo}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2 md:hidden">
            {filtrados.map((trabalho) => {
              const atribuidas = atribuicoes.filter((a) => a.trabalhoId === trabalho.id).length;
              const concluidas = avaliacoes.filter((a) => a.trabalhoId === trabalho.id && a.concluida).length;
              const sessao = sessaoPorNumero(trabalho.sessao);
              return (
                <div key={trabalho.id} className="card px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-brand-700">{trabalho.codigo}</span>
                        <Badge tom={atribuidas === 0 ? 'rose' : atribuidas === 1 ? 'amber' : 'green'} className="scale-90">
                          {atribuidas}/2
                        </Badge>
                        <span className="text-[9px] text-ink-muted">{contar(concluidas, 'concluída', 'concluídas')}</span>
                      </div>
                      <p className="mt-1 text-[12px] font-semibold leading-snug text-ink">{trabalho.titulo}</p>
                      <div className="mt-1 flex items-center gap-1.5 text-[9.5px] text-ink-muted">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: sessao.cor }} />
                        {String(sessao.numero).padStart(2, '0')} · {sessao.curto} · {categoriaPorNumero(trabalho.categoria).curto}
                      </div>
                      {trabalho.apresentador && (
                        <p className="mt-1 text-[10px] text-ink-muted">{trabalho.apresentador}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => onEditar(trabalho)}
                        className="rounded-lg border border-line p-1.5 text-ink-muted hover:bg-brand-50 hover:text-brand-700"
                        aria-label={`Editar ${trabalho.codigo}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onExcluir(trabalho)}
                        className="rounded-lg border border-line p-1.5 text-ink-muted hover:bg-rose-100 hover:text-rose-600"
                        aria-label={`Excluir ${trabalho.codigo}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
