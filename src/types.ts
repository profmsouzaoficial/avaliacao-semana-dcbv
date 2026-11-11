export type Papel = 'presidente' | 'avaliador';

export type NivelParticipante =
  | 'graduacao'
  | 'pos-graduacao'
  | 'docente'
  | 'outro';

export interface Membro {
  id: string;
  userId?: string | null;
  nome: string;
  email: string;
  titulacao: string;
  instituicao: string;
  papel: Papel;
  ativo: boolean;
  ordem: number;
}

export interface Trabalho {
  id: string;
  codigo: string;
  titulo: string;
  sessao: number;
  categoria: number;
  apresentador: string;
  autores: string;
  orientador: string;
  instituicao: string;
  periodo: string;
  nivel: NivelParticipante;
  resumo: string;
  linkPdf: string;
  observacoes: string;
}

export interface Atribuicao {
  id: string;
  trabalhoId: string;
  avaliadorId: string;
}

export interface Avaliacao {
  id: string;
  trabalhoId: string;
  avaliadorId: string;
  /** Nível atribuído em cada critério (0 a 4). Chaves "1" a "5". */
  notas: Record<string, number>;
  notaFinal: number;
  parecer: string;
  pontosFortes: string;
  sugestoes: string;
  indicacaoMencao: boolean;
  justificativaMencao: string;
  concluida: boolean;
  atualizadoEm: string;
}

export interface SessaoTematica {
  numero: number;
  nome: string;
  curto: string;
  cor: string;
}

export interface CategoriaTrabalho {
  numero: number;
  nome: string;
  curto: string;
  orientacaoMetodo: string;
}

export interface NivelRubrica {
  valor: 0 | 1 | 2 | 3 | 4;
  rotulo: string;
  pontos: number;
  descricao: string;
  tom: 'neutro' | 'atencao' | 'desenvolvimento' | 'adequado' | 'destaque';
}

export interface Criterio {
  id: number;
  numero: string;
  titulo: string;
  pergunta: string;
  porQue: string;
  observar: string[];
  niveis: NivelRubrica[];
}

export interface StatusTrabalho {
  trabalho: Trabalho;
  avaliacoes: Avaliacao[];
  media: number | null;
  mediasPorCriterio: Record<number, number | null>;
  concluidas: number;
  atribuidas: number;
  posicao: number | null;
  status: 'pendente' | 'rascunho' | 'concluida' | 'sem-atribuicao';
}

export interface RankingItem extends StatusTrabalho {
  votosMencao: number;
  elegivelDestaqueFormativo: boolean;
}

export interface ResumoAvaliador {
  membro: Membro;
  atribuidas: number;
  concluidas: number;
  rascunhos: number;
  pendentes: number;
  percentual: number;
}
