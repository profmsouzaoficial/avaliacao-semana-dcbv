import { CRITERIOS, calcularNota, totalRespondidos } from '../data/rubric';
import type {
  Atribuicao,
  Avaliacao,
  Membro,
  RankingItem,
  ResumoAvaliador,
  StatusTrabalho,
  Trabalho,
} from '../types';
import { periodoInicial } from './format';

export const MINIMO_AVALIACOES_POR_TRABALHO = 2;
const ORDEM_DESEMPATE = [4, 5, 1, 2, 3];

export function statusDoTrabalho(
  trabalho: Trabalho,
  atribuicoes: Atribuicao[],
  avaliacoes: Avaliacao[],
  avaliadorId?: string,
): StatusTrabalho {
  const atribuidasAvaliador = avaliadorId
    ? atribuicoes.filter((a) => a.trabalhoId === trabalho.id && a.avaliadorId === avaliadorId)
    : atribuicoes.filter((a) => a.trabalhoId === trabalho.id);
  const avaliacoesTrabalho = avaliacoes.filter((a) => a.trabalhoId === trabalho.id);
  const concluidas = avaliacoesTrabalho.filter((a) => a.concluida);
  const minha = avaliadorId
    ? avaliacoesTrabalho.find((a) => a.avaliadorId === avaliadorId)
    : undefined;

  const mediasPorCriterio: Record<number, number | null> = {};
  CRITERIOS.forEach((criterio) => {
    const valores = concluidas
      .map((a) => Number(a.notas[String(criterio.id)]))
      .filter((v) => Number.isInteger(v) && v >= 0 && v <= 4);
    mediasPorCriterio[criterio.id] =
      valores.length > 0
        ? (valores.reduce((soma, v) => soma + v, 0) / valores.length) * 5
        : null;
  });

  let status: StatusTrabalho['status'] = 'pendente';
  if (avaliadorId) {
    if (atribuidasAvaliador.length === 0) status = 'sem-atribuicao';
    else if (!minha) status = 'pendente';
    else if (minha.concluida) status = 'concluida';
    else status = 'rascunho';
  } else if (concluidas.length === 0) {
    status = 'pendente';
  } else if (concluidas.length < Math.max(1, atribuidasAvaliador.length)) {
    status = 'rascunho';
  } else {
    status = 'concluida';
  }

  return {
    trabalho,
    avaliacoes: avaliacoesTrabalho,
    media:
      concluidas.length > 0
        ? concluidas.reduce((soma, a) => soma + Number(a.notaFinal), 0) / concluidas.length
        : null,
    mediasPorCriterio,
    concluidas: concluidas.length,
    atribuidas: atribuidasAvaliador.length,
    posicao: null,
    status,
  };
}

function mesmoDesempenho(a: RankingItem, b: RankingItem): boolean {
  if (a.media === null || b.media === null) return false;
  if (Math.abs(a.media - b.media) > 0.001) return false;
  return ORDEM_DESEMPATE.every((id) => {
    const av = a.mediasPorCriterio[id] ?? -1;
    const bv = b.mediasPorCriterio[id] ?? -1;
    return Math.abs(av - bv) <= 0.001;
  });
}

export function compararRanking(a: RankingItem, b: RankingItem): number {
  if (a.media === null && b.media === null) return a.trabalho.codigo.localeCompare(b.trabalho.codigo);
  if (a.media === null) return 1;
  if (b.media === null) return -1;
  if (Math.abs(b.media - a.media) > 0.001) return b.media - a.media;
  for (const id of ORDEM_DESEMPATE) {
    const av = a.mediasPorCriterio[id] ?? -1;
    const bv = b.mediasPorCriterio[id] ?? -1;
    if (Math.abs(bv - av) > 0.001) return bv - av;
  }
  return a.trabalho.codigo.localeCompare(b.trabalho.codigo);
}

export function montarRanking(
  trabalhos: Trabalho[],
  atribuicoes: Atribuicao[],
  avaliacoes: Avaliacao[],
): RankingItem[] {
  const itens: RankingItem[] = trabalhos.map((trabalho) => {
    const base = statusDoTrabalho(trabalho, atribuicoes, avaliacoes);
    const integracao = base.mediasPorCriterio[4] ?? 0;
    return {
      ...base,
      votosMencao: base.avaliacoes.filter((a) => a.concluida && a.indicacaoMencao).length,
      elegivelDestaqueFormativo:
        base.concluidas > 0 &&
        trabalho.nivel === 'graduacao' &&
        periodoInicial(trabalho.periodo) &&
        integracao >= 15,
    };
  });

  const ordenados = [...itens].sort(compararRanking);
  let posicao = 0;
  let anterior: RankingItem | null = null;
  ordenados.forEach((item, indice) => {
    if (item.media === null) {
      item.posicao = null;
      return;
    }
    if (!anterior || !mesmoDesempenho(anterior, item)) {
      posicao = indice + 1;
    }
    item.posicao = posicao;
    anterior = item;
  });

  return ordenados;
}

export function vencedoresPorSessao(ranking: RankingItem[]): Record<number, RankingItem | null> {
  const resultado: Record<number, RankingItem | null> = {};
  for (let sessao = 1; sessao <= 7; sessao += 1) {
    const candidatos = ranking.filter(
      (item) => item.trabalho.sessao === sessao && item.media !== null,
    );
    resultado[sessao] = candidatos[0] ?? null;
  }
  return resultado;
}

export function resumoAvaliadores(
  membros: Membro[],
  atribuicoes: Atribuicao[],
  avaliacoes: Avaliacao[],
): ResumoAvaliador[] {
  return membros
    .filter((m) => m.ativo)
    .map((membro) => {
      const minhasAtribuicoes = atribuicoes.filter((a) => a.avaliadorId === membro.id);
      const minhasAvaliacoes = avaliacoes.filter((a) => a.avaliadorId === membro.id);
      const concluidas = minhasAvaliacoes.filter((a) => a.concluida).length;
      const rascunhos = minhasAvaliacoes.filter((a) => !a.concluida).length;
      const pendentes = Math.max(0, minhasAtribuicoes.length - concluidas - rascunhos);
      return {
        membro,
        atribuidas: minhasAtribuicoes.length,
        concluidas,
        rascunhos,
        pendentes,
        percentual:
          minhasAtribuicoes.length > 0 ? (concluidas / minhasAtribuicoes.length) * 100 : 0,
      };
    })
    .sort((a, b) => a.membro.ordem - b.membro.ordem || a.membro.nome.localeCompare(b.membro.nome));
}

export function cobertura(
  trabalhos: Trabalho[],
  _atribuicoes: Atribuicao[],
  avaliacoes: Avaliacao[],
): {
  total: number;
  comMinimo: number;
  semAvaliacao: number;
  incompletos: Trabalho[];
  percentual: number;
} {
  const incompletos: Trabalho[] = [];
  let semAvaliacao = 0;
  let comMinimo = 0;
  trabalhos.forEach((trabalho) => {
    const concluidas = avaliacoes.filter(
      (a) => a.trabalhoId === trabalho.id && a.concluida,
    ).length;
    if (concluidas === 0) semAvaliacao += 1;
    if (concluidas >= MINIMO_AVALIACOES_POR_TRABALHO) {
      comMinimo += 1;
    } else {
      incompletos.push(trabalho);
    }
  });
  const total = trabalhos.length;
  return {
    total,
    comMinimo,
    semAvaliacao,
    incompletos,
    percentual: total > 0 ? (comMinimo / total) * 100 : 0,
  };
}

export function ehAvaliacaoValida(avaliacao: Avaliacao): boolean {
  return (
    avaliacao.concluida &&
    totalRespondidos(avaliacao.notas) === CRITERIOS.length &&
    calcularNota(avaliacao.notas) === Number(avaliacao.notaFinal)
  );
}
