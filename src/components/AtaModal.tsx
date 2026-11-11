import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, FileText, Info, Printer, ShieldCheck, X } from 'lucide-react';
import { EVENTO } from '../data/event';
import { useApp } from '../context/AppContext';
import { cobertura, montarRanking, resumoAvaliadores, vencedoresPorSessao } from '../lib/scoring';
import { Badge } from './Badge';
import { Button } from './Button';
import { Modal } from './Modal';
import { AtaOficial, type DadosAta } from './AtaOficial';

interface AtaModalProps {
  aberto: boolean;
  onFechar: () => void;
}

function dataPadrao(): string {
  const fimEvento = new Date(`${EVENTO.ano}-11-19T12:00:00`);
  const hoje = new Date();
  const base = hoje > fimEvento ? hoje : fimEvento;
  const ano = base.getFullYear();
  const mes = String(base.getMonth() + 1).padStart(2, '0');
  const dia = String(base.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}T12:00:00`;
}

export function AtaModal({ aberto, onFechar }: AtaModalProps) {
  const { trabalhos, atribuicoes, avaliacoes, membros } = useApp();
  const [dataConsolidacao, setDataConsolidacao] = useState(dataPadrao);
  const [observacoes, setObservacoes] = useState('');

  const ranking = useMemo(
    () => montarRanking(trabalhos, atribuicoes, avaliacoes),
    [trabalhos, atribuicoes, avaliacoes],
  );
  const vencedores = useMemo(() => vencedoresPorSessao(ranking), [ranking]);
  const cob = useMemo(
    () => cobertura(trabalhos, atribuicoes, avaliacoes),
    [trabalhos, atribuicoes, avaliacoes],
  );
  const resumo = useMemo(
    () => resumoAvaliadores(membros, atribuicoes, avaliacoes),
    [membros, atribuicoes, avaliacoes],
  );

  const presidente =
    membros.find((m) => m.papel === 'presidente' && m.ativo) ??
    membros.find((m) => m.papel === 'presidente') ??
    null;

  const dados: DadosAta = {
    dataConsolidacao,
    observacoes,
    ranking,
    vencedores,
    cobertura: cob,
    resumo,
    membros,
    presidente,
  };

  if (!aberto) return null;

  return (
    <>
      <Modal
        aberto={aberto}
        onFechar={onFechar}
        titulo="Ata de consolidação"
        descricao="Minuta gerada a partir das avaliações concluídas. Revise as observações e imprima ou salve em PDF."
        largura="full"
        rodape={
          <>
            <Button variante="ghost" onClick={onFechar} icone={<X className="h-4 w-4" />}>
              Fechar
            </Button>
            <Button
              variante="dark"
              onClick={() => window.print()}
              icone={<Printer className="h-4 w-4" />}
            >
              Imprimir / salvar PDF
            </Button>
          </>
        }
      >
        <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
          <div className="space-y-3">
            <div className="card-flat p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-600" />
                <h3 className="font-serif text-[16px] font-semibold text-ink">Dados da ata</h3>
              </div>
              <label className="mt-3 block">
                <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-ink-soft">
                  <CalendarDays className="h-3.5 w-3.5 text-brand-600" />
                  Data da consolidação
                </span>
                <input
                  type="date"
                  value={dataConsolidacao.slice(0, 10)}
                  min={`${EVENTO.ano}-11-16`}
                  onChange={(e) => {
                    if (e.target.value) setDataConsolidacao(`${e.target.value}T12:00:00`);
                  }}
                  className="h-10 w-full rounded-xl border border-line bg-white px-3 text-[12px] text-ink outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                />
              </label>
              <label className="mt-3 block">
                <span className="mb-1 flex items-center justify-between gap-2 text-[11px] font-semibold text-ink-soft">
                  <span>Observações da comissão</span>
                  <span className="text-[9.5px] font-normal text-ink-muted">
                    {observacoes.length}/800
                  </span>
                </span>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={5}
                  maxLength={800}
                  placeholder="Opcional. Registre encaminhamentos, ressalvas ou deliberações da comissão."
                  className="w-full resize-y rounded-xl border border-line bg-white px-3 py-2.5 text-[12px] leading-relaxed text-ink outline-none placeholder:text-ink-muted/70 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                />
              </label>
            </div>

            <div className="card-flat p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-600" />
                <h3 className="font-serif text-[15px] font-semibold text-ink">O que entra na ata</h3>
              </div>
              <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-ink-muted">
                <li className="flex gap-1.5">
                  <span className="text-emerald-600">✓</span> Apenas avaliações concluídas; rascunhos
                  ficam de fora.
                </li>
                <li className="flex gap-1.5">
                  <span className="text-emerald-600">✓</span> Média, cobertura e indicações de menção
                  por sessão.
                </li>
                <li className="flex gap-1.5">
                  <span className="text-emerald-600">✓</span> Destaque formativo como sugestão
                  pedagógica, não como categoria oficial.
                </li>
                <li className="flex gap-1.5">
                  <span className="text-accent-600">!</span> A ata é uma minuta: revise e assine antes
                  de publicar.
                </li>
              </ul>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge tom="neutral">A4 · retrato</Badge>
                <Badge tom="amber">minuta</Badge>
                <Badge tom="brand">v1.0</Badge>
              </div>
            </div>

            <div className="rounded-2xl border border-accent-200 bg-accent-50 px-3.5 py-3">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-600" />
                <p className="text-[10.5px] leading-relaxed text-accent-700">
                  Ao imprimir, escolha <strong>Salvar como PDF</strong> no destino. O layout A4 já
                  está configurado sem margens do navegador.
                </p>
              </div>
            </div>

            <div className="text-[10px] leading-relaxed text-ink-muted">
              Assinatura: <strong className="text-ink-soft">{presidente?.nome ?? 'Presidência da Comissão Científica'}</strong>
              {presidente?.instituicao ? ` · ${presidente.instituicao}` : ''}
            </div>
          </div>

          <div className="min-w-0 overflow-auto rounded-2xl bg-[#e9e3d7] p-3 sm:p-4">
            <div className="mx-auto w-fit shadow-float">
              <div className="ata-preview">
                <AtaOficial dados={dados} />
              </div>
            </div>
          </div>
        </div>
      </Modal>
      {createPortal(
        <div id="print-portal">
          <AtaOficial dados={dados} />
        </div>,
        document.body,
      )}
    </>
  );
}
