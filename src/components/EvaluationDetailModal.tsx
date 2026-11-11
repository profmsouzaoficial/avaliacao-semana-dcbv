import { Award, CheckCircle2, CircleDashed, Clock3, Info, MessageSquareText } from 'lucide-react';
import type { Avaliacao, RankingItem } from '../types';
import { CRITERIOS, nivelPorValor } from '../data/rubric';
import { categoriaPorNumero, sessaoPorNumero } from '../data/event';
import { useApp } from '../context/AppContext';
import { classNames, formatarDataHora, formatarNota } from '../lib/format';
import { Badge } from './Badge';
import { EmptyState } from './EmptyState';
import { Modal } from './Modal';

interface EvaluationDetailModalProps {
  item: RankingItem | null;
  onFechar: () => void;
}

export function EvaluationDetailModal({ item, onFechar }: EvaluationDetailModalProps) {
  const { membros, atribuicoes, avaliacoes } = useApp();

  if (!item) return null;
  const { trabalho } = item;
  const sessao = sessaoPorNumero(trabalho.sessao);
  const categoria = categoriaPorNumero(trabalho.categoria);
  const atribuicoesTrabalho = atribuicoes.filter((a) => a.trabalhoId === trabalho.id);
  const avaliacoesTrabalho = avaliacoes.filter((a) => a.trabalhoId === trabalho.id);
  const membroPorId = (id: string) => membros.find((m) => m.id === id);
  const avaliacoesOrfas = avaliacoesTrabalho.filter(
    (a) => !atribuicoesTrabalho.some((at) => at.avaliadorId === a.avaliadorId),
  );

  return (
    <Modal
      aberto={Boolean(item)}
      onFechar={onFechar}
      titulo={`${trabalho.codigo} · ${trabalho.titulo}`}
      descricao={`${sessao.nome} · ${categoria.curto}`}
      largura="lg"
      rodape={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <span className="text-[10.5px] text-ink-muted">
            Notas individuais visíveis apenas para a presidência.
          </span>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-xl border border-line bg-white px-3 py-2 text-[11.5px] font-semibold text-ink-soft transition hover:border-brand-300 hover:text-ink"
          >
            Fechar
          </button>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-brand-950 px-4 py-3 text-white">
          <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-300">Média</div>
          <div className="mt-1 display text-[28px] font-semibold leading-none">
            {item.media !== null ? formatarNota(item.media, 1) : '—'}
          </div>
          <div className="text-[9.5px] text-brand-300">de 100</div>
        </div>
        <MiniIndicador rotulo="Posição" valor={item.posicao ? `${item.posicao}º` : '—'} detalhe="ranking geral" />
        <MiniIndicador
          rotulo="Avaliações"
          valor={`${item.concluidas}/${atribuicoesTrabalho.length || 0}`}
          detalhe="concluídas / atribuídas"
        />
        <MiniIndicador rotulo="Menções" valor={String(item.votosMencao)} detalhe="indicações registradas" />
      </div>

      <div className="mt-4 grid gap-2 rounded-2xl border border-line-soft bg-paper-light p-4 text-[11.5px] sm:grid-cols-2">
        <Linha rotulo="Apresentação" valor={trabalho.apresentador || 'A informar'} />
        <Linha rotulo="Autoria" valor={trabalho.autores || 'A informar'} />
        <Linha rotulo="Orientação" valor={trabalho.orientador || 'A informar'} />
        <Linha rotulo="Instituição" valor={trabalho.instituicao || 'A informar'} />
        <Linha rotulo="Nível / período" valor={rotuloNivel(trabalho.nivel, trabalho.periodo)} />
        <Linha rotulo="Sessão" valor={`${String(trabalho.sessao).padStart(2, '0')} · ${sessao.nome}`} />
      </div>

      <section className="mt-5">
        <div className="flex items-center gap-2">
          <span className="eyebrow">Médias por critério</span>
          <span className="text-[10px] text-ink-muted">0 a 20 pontos em cada</span>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {CRITERIOS.map((criterio) => {
            const valor = item.mediasPorCriterio[criterio.id];
            return (
              <div key={criterio.id} className="rounded-xl border border-line-soft bg-white px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[10.5px] font-medium text-ink-soft">
                    {criterio.titulo}
                  </span>
                  <span className="shrink-0 text-[10px] font-bold text-ink">
                    {valor !== null ? `${formatarNota(valor, 1)}/20` : '—'}
                  </span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-paper-deep">
                  <div
                    className="h-full rounded-full bg-brand-600"
                    style={{ width: `${valor !== null ? (valor / 20) * 100 : 0}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-brand-600" />
            <h3 className="font-serif text-[16px] font-semibold text-ink">Avaliações recebidas</h3>
          </div>
          <Badge tom={item.concluidas >= 2 ? 'green' : 'amber'}>
            {item.concluidas >= 2 ? 'Cobertura mínima' : 'Cobertura parcial'}
          </Badge>
        </div>

        {atribuicoesTrabalho.length === 0 && avaliacoesOrfas.length === 0 && (
          <div className="mt-3">
            <EmptyState
              compacto
              icone={<Clock3 className="h-5 w-5" />}
              titulo="Sem avaliação registrada"
              descricao="Atribua este trabalho a um avaliador na Curadoria para iniciar a cobertura."
            />
          </div>
        )}

        <div className="mt-3 space-y-3">
          {atribuicoesTrabalho.map((atribuicao) => {
            const avaliacao = avaliacoesTrabalho.find((a) => a.avaliadorId === atribuicao.avaliadorId);
            const membro = membroPorId(atribuicao.avaliadorId);
            return (
              <CartaoAvaliacao
                key={atribuicao.id}
                nome={membro?.nome ?? 'Avaliador(a)'}
                papel={membro?.papel ?? 'avaliador'}
                avaliacao={avaliacao}
              />
            );
          })}
          {avaliacoesOrfas.map((avaliacao) => {
            const membro = membroPorId(avaliacao.avaliadorId);
            return (
              <CartaoAvaliacao
                key={avaliacao.id}
                nome={membro?.nome ?? 'Avaliador(a)'}
                papel={membro?.papel ?? 'avaliador'}
                avaliacao={avaliacao}
              />
            );
          })}
        </div>
      </section>
    </Modal>
  );
}

function MiniIndicador({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe: string }) {
  return (
    <div className="rounded-2xl border border-line-soft bg-white px-4 py-3">
      <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink-muted">{rotulo}</div>
      <div className="mt-1 text-[22px] font-bold leading-none text-ink">{valor}</div>
      <div className="mt-1 text-[9.5px] text-ink-muted">{detalhe}</div>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.1em] text-ink-muted">
        {rotulo}
      </span>
      <span className="min-w-0 truncate text-[11px] font-medium text-ink-soft" title={valor}>
        {valor}
      </span>
    </div>
  );
}

function CartaoAvaliacao({
  nome,
  papel,
  avaliacao,
}: {
  nome: string;
  papel: string;
  avaliacao?: Avaliacao;
}) {
  if (!avaliacao) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-line bg-paper-light px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-paper-deep text-ink-muted">
          <Clock3 className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-ink-soft">{nome}</p>
          <p className="text-[10.5px] text-ink-muted">
            {papel === 'presidente' ? 'Presidência' : 'Avaliação'} · aguardando envio
          </p>
        </div>
        <Badge tom="neutral">Pendente</Badge>
      </div>
    );
  }

  const concluida = avaliacao.concluida;
  return (
    <div className="overflow-hidden rounded-2xl border border-line-soft bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-line-soft px-4 py-2.5">
        <span
          className={classNames(
            'flex h-7 w-7 items-center justify-center rounded-full',
            concluida ? 'bg-emerald-50 text-emerald-600' : 'bg-accent-50 text-accent-600',
          )}
        >
          {concluida ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleDashed className="h-3.5 w-3.5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-ink">{nome}</p>
          <p className="text-[9.5px] text-ink-muted">
            {papel === 'presidente' ? 'Presidência' : 'Avaliação'} ·{' '}
            {formatarDataHora(avaliacao.atualizadoEm)}
          </p>
        </div>
        <Badge tom={concluida ? 'green' : 'amber'}>{concluida ? 'Concluída' : 'Rascunho'}</Badge>
        <span className="rounded-lg bg-brand-950 px-2 py-1 text-[10px] font-bold text-white">
          {formatarNota(avaliacao.notaFinal, Number.isInteger(avaliacao.notaFinal) ? 0 : 1)}/100
        </span>
      </div>
      <div className="grid gap-3 px-4 py-3 sm:grid-cols-2">
        <div className="space-y-2">
          {CRITERIOS.map((criterio) => {
            const valor = Number(avaliacao.notas[String(criterio.id)]);
            const nivel = Number.isInteger(valor) ? nivelPorValor(criterio, valor) : undefined;
            return (
              <div key={criterio.id} className="flex items-center justify-between gap-2">
                <span className="truncate text-[10.5px] text-ink-muted">{criterio.titulo}</span>
                <span className="shrink-0 text-[10px] font-semibold text-ink-soft">
                  {nivel ? `${nivel.rotulo} · ${nivel.pontos}` : '—'}
                </span>
              </div>
            );
          })}
        </div>
        <div className="space-y-2 rounded-xl bg-paper-light p-3">
          <Bloco titulo="Pontos fortes" texto={avaliacao.pontosFortes} />
          <Bloco titulo="Sugestões" texto={avaliacao.sugestoes} />
          {avaliacao.parecer && <Bloco titulo="Parecer interno" texto={avaliacao.parecer} />}
          {avaliacao.indicacaoMencao && (
            <div className="flex items-start gap-1.5 rounded-lg bg-accent-50 px-2.5 py-2">
              <Award className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-600" />
              <p className="text-[10.5px] leading-relaxed text-accent-700">
                <strong className="font-semibold">Indicação de menção.</strong>{' '}
                {avaliacao.justificativaMencao || 'Sem justificativa.'}
              </p>
            </div>
          )}
        </div>
      </div>
      {!concluida && (
        <div className="flex items-center gap-1.5 border-t border-line-soft bg-accent-50/60 px-4 py-2 text-[10px] text-accent-700">
          <Info className="h-3 w-3" />
          Rascunho: não entra na média, no ranking nem na ata até ser concluído.
        </div>
      )}
    </div>
  );
}

function Bloco({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div>
      <div className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-ink-muted">{titulo}</div>
      <p className={classNames('mt-0.5 text-[10.5px] leading-relaxed', texto ? 'text-ink-soft' : 'italic text-ink-muted')}>
        {texto || 'Não informado.'}
      </p>
    </div>
  );
}

function rotuloNivel(nivel: string, periodo: string): string {
  if (nivel === 'graduacao') return periodo ? `Graduação · ${periodo}` : 'Graduação';
  if (nivel === 'pos-graduacao') return 'Pós-graduação';
  if (nivel === 'docente') return 'Docência';
  return 'A informar';
}
