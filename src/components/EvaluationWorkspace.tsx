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

  if (meus.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-6">
        <EmptyState
          icone={<ClipboardCheck className="h-6 w-6" />}
          titulo="Nenhuma avaliação atribuída"
          descricao={
            membro.papel === 'presidente'
              ? 'A presidência ainda não distribuiu estes trabalhos. Use o Painel para atribuir avaliadores e acompanhar a cobertura.'
              : 'A presidência da comissão ainda não atribuiu trabalhos ao seu perfil. Assim que a distribuição for feita, eles aparecem aqui.'
          }
          acao={
            membro.papel === 'presidente' ? (
              <Button onClick={onAbrirPainel} icone={<LayoutDashboard className="h-4 w-4" />}>
                Ir para o Painel
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
