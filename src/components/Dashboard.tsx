import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  LayoutGrid,
  Target,
  TrendingUp,
} from 'lucide-react';
import type { RankingItem } from '../types';
import { EVENTO } from '../data/event';
import { useApp } from '../context/AppContext';
import { cobertura, montarRanking } from '../lib/scoring';
import { baixarArquivo, rankingParaCsv } from '../lib/csv';
import { classNames, contar, formatarDataHora, formatarNota } from '../lib/format';
import { Badge } from './Badge';
import { Button } from './Button';
import { StatCard } from './StatCard';
import { RankingTable } from './RankingTable';
import { SessionsPanel } from './SessionsPanel';
import { CoveragePanel } from './CoveragePanel';
import { EvaluationDetailModal } from './EvaluationDetailModal';
import { AtaModal } from './AtaModal';

type AbaPainel = 'ranking' | 'sessoes' | 'cobertura';

interface DashboardProps {
  onAbrirCuradoria: () => void;
}

export function Dashboard({ onAbrirCuradoria }: DashboardProps) {
  const { trabalhos, atribuicoes, avaliacoes, membros, notificar } = useApp();
  const [aba, setAba] = useState<AbaPainel>('ranking');
  const [detalhe, setDetalhe] = useState<RankingItem | null>(null);
  const [ataAberta, setAtaAberta] = useState(false);

  const ranking = useMemo(
    () => montarRanking(trabalhos, atribuicoes, avaliacoes),
    [trabalhos, atribuicoes, avaliacoes],
  );
  const cob = useMemo(
    () => cobertura(trabalhos, atribuicoes, avaliacoes),
    [trabalhos, atribuicoes, avaliacoes],
  );
  const avaliados = ranking.filter((i) => i.media !== null);
  const mediaGeral =
    avaliados.length > 0
      ? avaliados.reduce((soma, i) => soma + (i.media ?? 0), 0) / avaliados.length
      : null;
  const concluidas = avaliacoes.filter((a) => a.concluida).length;
  const rascunhos = avaliacoes.filter((a) => !a.concluida).length;
  const semAtribuicao = trabalhos.filter((t) => !atribuicoes.some((a) => a.trabalhoId === t.id)).length;
  const membrosAtivos = membros.filter((m) => m.ativo && m.papel === 'avaliador').length;
  const mencoes = avaliacoes.filter((a) => a.concluida && a.indicacaoMencao).length;
  const elegiveis = ranking.filter((i) => i.elegivelDestaqueFormativo).length;
  const ultimaAtualizacao = avaliacoes.reduce<string | null>(
    (maior, a) => (!maior || a.atualizadoEm > maior ? a.atualizadoEm : maior),
    null,
  );

  const detalheAtual = detalhe
    ? ranking.find((i) => i.trabalho.id === detalhe.trabalho.id) ?? detalhe
    : null;

  const exportar = () => {
    baixarArquivo(
      `ranking-dcbv-${new Date().toISOString().slice(0, 10)}.csv`,
      rankingParaCsv(ranking),
    );
    notificar('Ranking exportado em CSV. O arquivo abre no Excel com acentuação.', 'sucesso');
  };

  const abasPainel: { id: AbaPainel; rotulo: string; icone: typeof BarChart3; contagem: number | string }[] = [
    { id: 'ranking', rotulo: 'Ranking geral', icone: BarChart3, contagem: ranking.length },
    { id: 'sessoes', rotulo: 'Menções por sessão', icone: Award, contagem: new Set(ranking.filter((i) => i.media !== null).map((i) => i.trabalho.sessao)).size },
    { id: 'cobertura', rotulo: 'Cobertura', icone: ClipboardList, contagem: `${Math.round(cob.percentual)}%` },
  ];

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">Comissão Científica</span>
            <Badge tom="amber">prévia de consolidação</Badge>
          </div>
          <h1 className="display mt-1.5 text-[29px] font-semibold leading-tight tracking-tight text-ink sm:text-[36px]">
            Painel de consolidação
          </h1>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-ink-muted">
            Acompanhe a cobertura, veja o ranking por sessão e prepare a ata da {EVENTO.nome}. A
            comissão delibera; o painel organiza a evidência.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variante="secondary"
            onClick={exportar}
            icone={<Download className="h-4 w-4" />}
          >
            Exportar ranking
          </Button>
          <Button
            variante="dark"
            onClick={() => setAtaAberta(true)}
            icone={<FileText className="h-4 w-4" />}
          >
            Gerar ata
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          rotulo="Média geral"
          valor={mediaGeral !== null ? formatarNota(mediaGeral, 1) : '—'}
          detalhe={
            avaliados.length > 0
              ? `entre ${contar(avaliados.length, 'trabalho', 'trabalhos')} já ${avaliados.length === 1 ? 'avaliado' : 'avaliados'}`
              : 'nenhuma avaliação concluída ainda'
          }
          icone={<TrendingUp className="h-4 w-4" />}
          tom="brand"
        />
        <StatCard
          rotulo="Cobertura"
          valor={`${Math.round(cob.percentual)}%`}
          detalhe={`${cob.comMinimo} de ${cob.total} com o mínimo de 2 avaliações`}
          icone={<Target className="h-4 w-4" />}
          tom="amber"
        />
        <StatCard
          rotulo="Avaliações concluídas"
          valor={concluidas}
          detalhe={`${contar(rascunhos, 'rascunho', 'rascunhos')} · ${contar(membrosAtivos, 'avaliador ativo', 'avaliadores ativos')}`}
          icone={<CheckCircle2 className="h-4 w-4" />}
          tom="brand"
        />
        <StatCard
          rotulo="Pendências"
          valor={cob.incompletos.length}
          detalhe={`${cob.semAvaliacao} sem avaliação · ${semAtribuicao} sem atribuição`}
          icone={<AlertTriangle className="h-4 w-4" />}
          tom="rose"
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="card flex items-center gap-3 px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
            <Award className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[9.5px] font-bold uppercase tracking-[0.13em] text-ink-muted">
              Indicações de menção
            </div>
            <div className="text-[12px] font-semibold text-ink">
              {contar(mencoes, 'voto registrado', 'votos registrados')}
            </div>
          </div>
          <span className="text-[10px] text-ink-muted">a comissão delibera</span>
        </div>
        <div
          className="card flex items-center gap-3 px-4 py-3"
          title="Reconhecimento pedagógico, não categoria oficial. Exige graduação, 1º–4º período e média ≥ 15/20 no critério 4. O parecer não informa nível e período; preencha na curadoria."
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <LayoutGrid className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[9.5px] font-bold uppercase tracking-[0.13em] text-ink-muted">
              Destaques formativos
            </div>
            <div className="text-[12px] font-semibold text-ink">
              {contar(elegiveis, 'trabalho elegível', 'trabalhos elegíveis')}
            </div>
          </div>
          <span className="text-[10px] text-ink-muted">graduação · 1º–4º</span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="scrollbar-thin inline-flex max-w-full overflow-x-auto rounded-2xl border border-line bg-white p-1 shadow-sm">
          {abasPainel.map((item) => {
            const Icone = item.icone;
            const ativo = aba === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setAba(item.id)}
                title={
                  item.id === 'cobertura'
                    ? `${Math.round(cob.percentual)}% de cobertura · ${contar(cob.incompletos.length, 'trabalho pendente', 'trabalhos pendentes')}`
                    : item.rotulo
                }
                className={classNames(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[11.5px] font-semibold transition',
                  ativo ? 'bg-brand-900 text-white shadow-sm' : 'text-ink-muted hover:bg-paper hover:text-ink',
                )}
              >
                <Icone className={classNames('h-3.5 w-3.5', ativo ? 'text-accent-400' : 'text-ink-muted')} />
                {item.rotulo}
                <span
                  className={classNames(
                    'ml-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                    ativo ? 'bg-white/15 text-white' : 'bg-paper-deep text-ink-muted',
                  )}
                >
                  {item.contagem}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-ink-muted">
          {ultimaAtualizacao
            ? `Última atualização: ${formatarDataHora(ultimaAtualizacao)}`
            : 'Nenhuma avaliação registrada ainda'}
        </p>
      </div>

      <div className="mt-4">
        {aba === 'ranking' && <RankingTable ranking={ranking} onDetalhar={setDetalhe} />}
        {aba === 'sessoes' && (
          <SessionsPanel
            ranking={ranking}
            onDetalhar={setDetalhe}
            onAbrirCuradoria={onAbrirCuradoria}
          />
        )}
        {aba === 'cobertura' && (
          <CoveragePanel
            ranking={ranking}
            onDetalhar={setDetalhe}
            onAbrirCuradoria={onAbrirCuradoria}
          />
        )}
      </div>

      <EvaluationDetailModal item={detalheAtual} onFechar={() => setDetalhe(null)} />
      <AtaModal aberto={ataAberta} onFechar={() => setAtaAberta(false)} />
    </div>
  );
}
