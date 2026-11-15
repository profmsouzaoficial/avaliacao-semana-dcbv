import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, LayoutDashboard, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { contar } from '../lib/format';
import { statusDoTrabalho } from '../lib/scoring';
import { Badge } from './Badge';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { EvaluationForm } from './EvaluationForm';
import { WorkSidebar } from './WorkSidebar';

interface EvaluationWorkspaceProps {
  onAbrirPainel: () => void;
}

export function EvaluationWorkspace({ onAbrirPainel }: EvaluationWorkspaceProps) {
  const { membro, trabalhos, atribuicoes, avaliacoes } = useApp();
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);

  const meus = useMemo(() => {
    if (!membro) return [];
    return trabalhos
      .filter((t) => atribuicoes.some((a) => a.trabalhoId === t.id && a.avaliadorId === membro.id))
      .map((t) => statusDoTrabalho(t, atribuicoes, avaliacoes, membro.id))
      .sort((a, b) => a.trabalho.codigo.localeCompare(b.trabalho.codigo));
  }, [membro, trabalhos, atribuicoes, avaliacoes]);

  useEffect(() => {
    if (meus.length === 0) {
      if (selecionadoId !== null) setSelecionadoId(null);
      return;
    }
    const existe = meus.some((i) => i.trabalho.id === selecionadoId);
    if (!existe) {
      const proximoPendente = meus.find((i) => i.status !== 'concluida') ?? meus[0];
      setSelecionadoId(proximoPendente.trabalho.id);
    }
  }, [meus, selecionadoId]);

  const selecionado = meus.find((i) => i.trabalho.id === selecionadoId)?.trabalho ?? null;

  const proximo = useMemo(() => {
    if (!selecionadoId) return undefined;
    const indice = meus.findIndex((i) => i.trabalho.id === selecionadoId);
    const depois = meus.slice(indice + 1).find((i) => i.status !== 'concluida');
    const qualquer = meus.find((i) => i.status !== 'concluida' && i.trabalho.id !== selecionadoId);
    return (depois ?? qualquer)?.trabalho.id;
  }, [meus, selecionadoId]);

  const selecionar = (id: string) => {
    setSelecionadoId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!membro) return null;

  const cabecalho = (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="eyebrow">Visão de avaliador</div>
        <h1 className="display mt-1.5 text-[28px] font-semibold leading-tight tracking-tight text-ink sm:text-[34px]">
          Minhas avaliações
        </h1>
        <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-ink-muted">
          Aqui aparecem somente os trabalhos atribuídos a você.{' '}
          {membro.papel === 'presidente'
            ? 'A visão completa da comissão continua disponível no Painel.'
            : 'Se algum trabalho seu não aparecer, fale com a presidência da comissão.'}
        </p>
      </div>
      {membro.papel === 'presidente' && (
        <Button
          variante="secondary"
          onClick={onAbrirPainel}
          icone={<LayoutDashboard className="h-4 w-4" />}
        >
          Visão da comissão
        </Button>
      )}
    </div>
  );

  if (meus.length === 0) {
    return (
      <div className="mx-auto max-w-3xl py-4">
        {cabecalho}
        <EmptyState
          icone={<ClipboardCheck className="h-6 w-6" />}
          titulo="Nenhuma avaliação atribuída"
          descricao={
            membro.papel === 'presidente'
              ? 'Você ainda não tem trabalhos atribuídos para avaliar. A distribuição é feita na Curadoria; o Painel continua disponível para a visão da comissão.'
              : 'A presidência da comissão ainda não atribuiu trabalhos ao seu perfil. Assim que a distribuição for feita, eles aparecem aqui.'
          }
          acao={
            membro.papel === 'presidente' ? (
              <Button onClick={onAbrirPainel} icone={<LayoutDashboard className="h-4 w-4" />}>
                Visão da comissão
              </Button>
            ) : (
              <Badge tom="brand" ponto>
                Aguardando distribuição
              </Badge>
            )
          }
        />
      </div>
    );
  }

  const concluidas = meus.filter((i) => i.status === 'concluida').length;

  return (
    <div>
      {cabecalho}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-ink-muted">
          <ClipboardCheck className="h-3.5 w-3.5 text-brand-600" />
          <span>Avaliação de banners</span>
          <span className="text-line">·</span>
          <span>{meus.length} atribuídos</span>
          <span className="text-line">·</span>
          <span>{concluidas} concluídos</span>
        </div>
        <Badge tom={concluidas === meus.length ? 'green' : 'amber'} ponto>
          {concluidas === meus.length ? 'Tudo concluído' : contar(meus.length - concluidas, 'pendente', 'pendentes')}
        </Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        <WorkSidebar itens={meus} selecionadoId={selecionadoId} onSelecionar={selecionar} />
        <div className="min-w-0">
          {selecionado ? (
            <EvaluationForm
              key={selecionado.id}
              trabalho={selecionado}
              onProximo={proximo ? () => selecionar(proximo) : undefined}
              temProximo={Boolean(proximo)}
            />
          ) : (
            <EmptyState
              compacto
              icone={<Sparkles className="h-6 w-6" />}
              titulo="Selecione um trabalho"
              descricao="Escolha um banner na lista ao lado para começar ou continuar a avaliação."
            />
          )}
        </div>
      </div>
    </div>
  );
}
