import { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  Filter,
  Loader2,
  Search,
  Users,
  Wand2,
  X,
} from 'lucide-react';
import type { Trabalho } from '../types';
import { SESSOES, sessaoPorNumero } from '../data/event';
import { useApp } from '../context/AppContext';
import { mensagemDeErro } from '../lib/supabase';
import { classNames, contar, iniciais } from '../lib/format';
import { Badge } from './Badge';
import { Button } from './Button';

interface DistributionMatrixProps {
  onEditarTrabalho: (trabalho: Trabalho) => void;
}

export function DistributionMatrix({ onEditarTrabalho }: DistributionMatrixProps) {
  const { trabalhos, membros, atribuicoes, avaliacoes, atribuir, desatribuir, notificar } = useApp();
  const [busca, setBusca] = useState('');
  const [sessaoFiltro, setSessaoFiltro] = useState<'todas' | number>('todas');
  const [ocupados, setOcupados] = useState<Set<string>>(new Set());
  const [distribuindo, setDistribuindo] = useState(false);

  const avaliadores = useMemo(
    () => membros.filter((m) => m.ativo).sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome)),
    [membros],
  );
  const mapaAtribuicoes = useMemo(
    () => new Set(atribuicoes.map((a) => `${a.trabalhoId}:${a.avaliadorId}`)),
    [atribuicoes],
  );
  const mapaAvaliacoes = useMemo(() => {
    const mapa = new Map<string, boolean>();
    avaliacoes.forEach((a) => mapa.set(`${a.trabalhoId}:${a.avaliadorId}`, a.concluida));
    return mapa;
  }, [avaliacoes]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return trabalhos
      .filter((t) => (sessaoFiltro === 'todas' ? true : t.sessao === sessaoFiltro))
      .filter(
        (t) =>
          !termo ||
          t.codigo.toLowerCase().includes(termo) ||
          t.titulo.toLowerCase().includes(termo),
      )
      .sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [trabalhos, busca, sessaoFiltro]);

  const totalAtribuicoes = atribuicoes.length;
  const semAtribuicao = trabalhos.filter((t) => !atribuicoes.some((a) => a.trabalhoId === t.id)).length;

  const alternar = async (trabalhoId: string, avaliadorId: string) => {
    const chave = `${trabalhoId}:${avaliadorId}`;
    if (ocupados.has(chave)) return;
    setOcupados((atual) => new Set(atual).add(chave));
    const atribuido = mapaAtribuicoes.has(chave);
    try {
      if (atribuido) {
        await desatribuir(avaliadorId, trabalhoId);
      } else {
        await atribuir(avaliadorId, [trabalhoId]);
      }
    } catch (e) {
      notificar(mensagemDeErro(e), 'erro');
    } finally {
      setOcupados((atual) => {
        const proximo = new Set(atual);
        proximo.delete(chave);
        return proximo;
      });
    }
  };

  const completarDistribuicao = async () => {
    const candidatos = avaliadores.filter((m) => m.papel === 'avaliador');
    const elegiveis = candidatos.length > 0 ? candidatos : avaliadores;
    if (elegiveis.length === 0) {
      notificar('Cadastre ao menos um avaliador ativo antes de distribuir.', 'erro');
      return;
    }
    if (
      !window.confirm(
        `Completar a distribuição até 2 avaliadores por trabalho?\n\nA presidência não entra automaticamente. Atribuições existentes serão mantidas.`,
      )
    ) {
      return;
    }

    setDistribuindo(true);
    try {
      const contagem = new Map<string, number>();
      elegiveis.forEach((m) => contagem.set(m.id, 0));
      atribuicoes.forEach((a) => {
        if (contagem.has(a.avaliadorId)) {
          contagem.set(a.avaliadorId, (contagem.get(a.avaliadorId) ?? 0) + 1);
        }
      });

      const adicoes = new Map<string, string[]>();
      trabalhos.forEach((trabalho) => {
        const atuais = atribuicoes.filter((a) => a.trabalhoId === trabalho.id);
        const idsAtuais = new Set(atuais.map((a) => a.avaliadorId));
        let total = atuais.length;
        while (total < 2) {
          const escolhido = elegiveis
            .filter((m) => !idsAtuais.has(m.id))
            .sort(
              (a, b) =>
                (contagem.get(a.id) ?? 0) - (contagem.get(b.id) ?? 0) ||
                a.ordem - b.ordem ||
                a.nome.localeCompare(b.nome),
            )[0];
          if (!escolhido) break;
          const chave = `${trabalho.id}:${escolhido.id}`;
          if (mapaAtribuicoes.has(chave)) break;
          idsAtuais.add(escolhido.id);
          contagem.set(escolhido.id, (contagem.get(escolhido.id) ?? 0) + 1);
          const lista = adicoes.get(escolhido.id) ?? [];
          lista.push(trabalho.id);
          adicoes.set(escolhido.id, lista);
          total += 1;
        }
      });

      let criadas = 0;
      for (const [avaliadorId, ids] of adicoes.entries()) {
        if (ids.length === 0) continue;
        await atribuir(avaliadorId, ids);
        criadas += ids.length;
      }
      notificar(
        criadas > 0
          ? `${contar(criadas, 'atribuição criada', 'atribuições criadas')} para completar a cobertura.`
          : 'Todos os trabalhos já têm 2 avaliações atribuídas.',
        criadas > 0 ? 'sucesso' : 'info',
      );
    } catch (e) {
      notificar(mensagemDeErro(e), 'erro');
    } finally {
      setDistribuindo(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="card flex flex-col gap-3 px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por código ou título"
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
              className="h-9 w-full appearance-none rounded-xl border border-line bg-paper-light pl-8 pr-8 text-[11px] text-ink outline-none focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100 sm:w-[220px]"
            >
              <option value="todas">Todas as sessões</option>
              {SESSOES.map((s) => (
                <option key={s.numero} value={s.numero}>
                  {String(s.numero).padStart(2, '0')} · {s.curto}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tom={semAtribuicao > 0 ? 'amber' : 'green'} ponto>
            {semAtribuicao} sem atribuição
          </Badge>
          <Badge tom="neutral">
            {contar(totalAtribuicoes, 'atribuição', 'atribuições')} · {contar(filtrados.length, 'trabalho', 'trabalhos')}
          </Badge>
          <Button
            variante="secondary"
            tamanho="sm"
            onClick={() => void completarDistribuicao()}
            carregando={distribuindo}
            icone={<Wand2 className="h-3.5 w-3.5" />}
          >
            Completar distribuição
          </Button>
        </div>
      </div>

      {avaliadores.length === 0 ? (
        <div className="card px-5 py-10 text-center">
          <Users className="mx-auto h-7 w-7 text-ink-muted" />
          <p className="mt-2 font-serif text-[17px] font-semibold text-ink">Nenhum membro ativo</p>
          <p className="mt-1 text-[11.5px] text-ink-muted">
            Cadastre avaliadores na aba Membros para montar a distribuição.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-line-soft bg-paper-light">
                  <th className="sticky left-0 z-10 min-w-[300px] bg-paper-light px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                    Trabalho
                  </th>
                  {avaliadores.map((membro) => {
                    const total = atribuicoes.filter((a) => a.avaliadorId === membro.id).length;
                    return (
                      <th key={membro.id} className="min-w-[112px] px-2 py-2.5 text-center align-top">
                        <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-brand-900 text-[8px] font-bold text-white">
                          {iniciais(membro.nome)}
                        </div>
                        <div className="mt-1 max-w-[108px] truncate px-1 text-[9.5px] font-semibold normal-case tracking-normal text-ink-soft" title={membro.nome}>
                          {membro.nome.replace(/\(.*?\)/g, '').trim()}
                        </div>
                        <div className="text-[8.5px] font-normal normal-case tracking-normal text-ink-muted">
                          {contar(total, 'atribuído', 'atribuídos')}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((trabalho) => {
                  const atribuidas = atribuicoes.filter((a) => a.trabalhoId === trabalho.id).length;
                  const sessao = sessaoPorNumero(trabalho.sessao);
                  return (
                    <tr
                      key={trabalho.id}
                      className={classNames(
                        'group border-b border-line-soft/70 transition',
                        atribuidas === 0 ? 'bg-rose-100/30' : atribuidas === 1 ? 'bg-accent-50/50' : 'hover:bg-brand-50/30',
                      )}
                    >
                      <td className="sticky left-0 z-10 bg-inherit px-4 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onEditarTrabalho(trabalho)}
                            className="shrink-0 font-mono text-[10px] font-bold text-brand-700 underline decoration-brand-200 underline-offset-2 hover:text-brand-900"
                          >
                            {trabalho.codigo}
                          </button>
                          <span
                            className={classNames(
                              'shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold',
                              atribuidas === 0
                                ? 'bg-rose-500/15 text-rose-600'
                                : atribuidas === 1
                                  ? 'bg-accent-500/20 text-accent-700'
                                  : 'bg-emerald-500/15 text-emerald-700',
                            )}
                          >
                            {atribuidas}/2
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onEditarTrabalho(trabalho)}
                          className="mt-0.5 block max-w-[360px] truncate text-left text-[11px] font-medium text-ink hover:underline"
                          title={trabalho.titulo}
                        >
                          {trabalho.titulo}
                        </button>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[8.5px] text-ink-muted">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: sessao.cor }}
                          />
                          {String(sessao.numero).padStart(2, '0')} · {sessao.curto}
                        </div>
                      </td>
                      {avaliadores.map((membro) => {
                        const chave = `${trabalho.id}:${membro.id}`;
                        const atribuido = mapaAtribuicoes.has(chave);
                        const carregando = ocupados.has(chave);
                        const avaliacao = mapaAvaliacoes.get(chave);
                        const concluida = avaliacao === true;
                        return (
                          <td key={membro.id} className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => void alternar(trabalho.id, membro.id)}
                              disabled={carregando}
                              aria-pressed={atribuido}
                              aria-label={`${atribuido ? 'Remover' : 'Atribuir'} ${trabalho.codigo} para ${membro.nome}`}
                              className={classNames(
                                'relative mx-auto flex h-7 w-7 items-center justify-center rounded-lg border transition',
                                atribuido
                                  ? 'border-brand-700 bg-brand-800 text-white shadow-sm hover:bg-brand-900'
                                  : 'border-line bg-white text-transparent hover:border-brand-300 hover:bg-brand-50',
                                carregando && 'cursor-wait opacity-60',
                              )}
                            >
                              {carregando ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-muted" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              {atribuido && avaliacao !== undefined && (
                                <span
                                  className={classNames(
                                    'absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-1 ring-white',
                                    concluida ? 'bg-emerald-400' : 'bg-accent-400',
                                  )}
                                  title={concluida ? 'Avaliação concluída' : 'Rascunho'}
                                />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtrados.length === 0 && (
            <div className="px-5 py-10 text-center">
              <p className="text-[12px] text-ink-muted">Nenhum trabalho encontrado com esses filtros.</p>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft bg-paper-light px-4 py-2.5 text-[9.5px] text-ink-muted">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> avaliação concluída
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-accent-400" /> rascunho
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-3 w-3 rounded border border-brand-700 bg-brand-800" /> atribuído
              </span>
            </div>
            <span>Clique no código para editar o trabalho.</span>
          </div>
        </div>
      )}
    </div>
  );
}
