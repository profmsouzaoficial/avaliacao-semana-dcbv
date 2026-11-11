import type { Criterio, NivelRubrica } from '../types';

export const PONTOS_POR_NIVEL = 5;
export const NOTA_MAXIMA = 100;
export const CRITERIO_INTEGRACAO = 4;

const niveis = (
  descricoes: [string, string, string, string, string],
): NivelRubrica[] => {
  const rotulos = [
    'Não avaliável',
    'Iniciante',
    'Em desenvolvimento',
    'Adequado',
    'Destaque',
  ] as const;
  const tons = ['neutro', 'atencao', 'desenvolvimento', 'adequado', 'destaque'] as const;
  return descricoes.map((descricao, indice) => ({
    valor: indice as 0 | 1 | 2 | 3 | 4,
    rotulo: rotulos[indice],
    pontos: indice * PONTOS_POR_NIVEL,
    descricao,
    tom: tons[indice],
  }));
};

/**
 * Rubrica didática de cinco dimensões, 20 pontos cada.
 *
 * A escolha por níveis de 0 a 4 (em vez de 15 itens Likert) é deliberada:
 * em uma sessão de pôsteres o avaliador tem poucos minutos por trabalho.
 * Cinco decisões explícitas, com descritores observáveis, são mais
 * consistentes do que quinze cliques rápidos — e ensinam o que se espera.
 */
export const CRITERIOS: Criterio[] = [
  {
    id: 1,
    numero: '1',
    titulo: 'Clareza e organização do pôster',
    pergunta: 'Dá para entender o trabalho só de olhar o pôster?',
    porQue:
      'No evento, o visitante tem pouco tempo. Um pôster claro respeita o leitor e permite que a conversa comece pelo conteúdo, não pela decifração.',
    observar: [
      'Título legível, específico e com o código do resumo visível',
      'Seções na ordem esperada: introdução, objetivo, método, resultados e conclusão',
      'Figuras, tabelas e esquemas com legendas que se sustentam sozinhos',
      'Texto legível a aproximadamente 1 metro, sem excesso de blocos',
      'Ortografia e formatação que não atrapalham a leitura',
    ],
    niveis: niveis([
      'Seções ausentes, texto ilegível ou o pôster não permite identificar o trabalho.',
      'Estrutura incompleta e leitura difícil; poucos recursos visuais ou sem relação com o texto.',
      'Estrutura básica presente, mas com lacunas de organização, legibilidade ou legendas.',
      'Estrutura clara e completa; leitura fluida a 1 m; figuras e tabelas ajudam a entender.',
      'Síntese visual exemplar: o pôster conta a história do trabalho com autonomia e elegância.',
    ]),
  },
  {
    id: 2,
    numero: '2',
    titulo: 'Pergunta, objetivo e justificativa',
    pergunta: 'O trabalho diz o que quer saber e por que isso importa?',
    porQue:
      'Um objetivo bem formulado é o mapa do pôster. Para quem está começando, vale mais um recorte pequeno e bem justificado do que um tema enorme e vago.',
    observar: [
      'Pergunta ou objetivo explícito, compreensível para quem é de outra área',
      'Relação com um problema real de saúde ou de formação profissional',
      'Justificativa com contexto, dados ou experiência — não apenas “é importante”',
      'Escopo compatível com a categoria e com o tempo de um trabalho de graduação',
    ],
    niveis: niveis([
      'Não há pergunta, objetivo ou justificativa identificável.',
      'Tema genérico; objetivo confuso, muito amplo ou desconectado do que foi apresentado.',
      'Objetivo compreensível, mas justificativa frágil ou genérica; escopo maior do que o trabalho permite.',
      'Pergunta clara, justificativa convincente e escopo factível para um trabalho de graduação.',
      'Pergunta instigante e bem delimitada; justificativa ancorada em contexto ou dados; escopo maduro para o nível.',
    ]),
  },
  {
    id: 3,
    numero: '3',
    titulo: 'Caminho metodológico adequado à categoria',
    pergunta: 'O que foi feito está descrito o suficiente para eu entender — e, se quisesse, repetir?',
    porQue:
      'Não esperamos estatística avançada de um trabalho inicial. Esperamos coerência: o caminho escolhido combina com a pergunta e é descrito com honestidade, inclusive nas limitações.',
    observar: [
      'A categoria declarada combina com o que o pôster apresenta',
      'Revisão: bases, fontes, critérios de seleção e período',
      'Caso ou experiência: contexto, participantes, etapas e cuidado ético',
      'Pesquisa: desenho, amostra, instrumentos, análise e limitações',
      'Projeto: etapas, cronograma, viabilidade e aspectos éticos',
      'O que ainda não foi feito é assumido, não escondido',
    ],
    niveis: niveis([
      'Método ausente ou incompatível com o que foi apresentado.',
      'Método apenas citado; não é possível entender o que foi feito.',
      'Método descrito em linhas gerais, com passos importantes faltando ou pouca coerência com o objetivo.',
      'Método claro e coerente com a pergunta; limitações reconhecidas.',
      'Método transparente e adequado à categoria; escolhas justificadas; limitações bem discutidas.',
    ]),
  },
  {
    id: 4,
    numero: '4',
    titulo: 'Diálogo entre ciências básicas e formação em saúde',
    pergunta: 'O trabalho mostra como o conhecimento básico ajuda a entender a saúde e a futura profissão?',
    porQue:
      'Este é o coração da I Semana do DCBV. Não basta citar “anatomia” ou “fisiologia”: queremos ver a ponte entre o conceito básico, o problema de saúde e a formação profissional.',
    observar: [
      'Conceitos das ciências básicas identificados e explicados, não apenas nomeados',
      'Ligação explícita com a prática, a formação ou o cuidado em saúde',
      'Linguagem acessível a estudantes dos períodos iniciais',
      'Integração entre áreas, quando o trabalho permite',
      'O trabalho ajudaria um calouro a entender por que estudar aquilo importa',
    ],
    niveis: niveis([
      'Não há conexão com ciências básicas ou com a formação em saúde.',
      'Conexão apenas no título ou em uma frase solta; conceitos não explicados.',
      'Conexão presente, mas superficial ou genérica; poderia ser dita por qualquer trabalho.',
      'Conexão clara e pertinente; conceitos básicos explicados e ligados à prática.',
      'Integração exemplar: o básico ilumina o problema e a formação, com linguagem acessível e implicações claras.',
    ]),
  },
  {
    id: 5,
    numero: '5',
    titulo: 'Apresentação oral e domínio do trabalho',
    pergunta: 'A pessoa consegue explicar o trabalho sem ler o pôster e responder ao que perguntamos?',
    porQue:
      'A apresentação também é formação: comunicar com clareza, ouvir a pergunta e reconhecer o que ainda não se sabe são competências profissionais.',
    observar: [
      'Apresentação dentro do tempo, com começo, meio e fim',
      'Explica com as próprias palavras, usando o pôster como apoio',
      'Contato visual e postura acolhedora com quem pergunta',
      'Responde ao que foi perguntado, sem desviar',
      'Reconhece limites e incertezas com maturidade',
    ],
    niveis: niveis([
      'Não foi possível avaliar a apresentação (ausência ou recusa).',
      'Leitura do pôster; dificuldade de explicar o trabalho ou responder a perguntas simples.',
      'Apresentação compreensível, mas dependente do texto; respostas parciais ou evasivas.',
      'Apresentação clara e segura; responde ao essencial; usa bem o pôster como apoio.',
      'Apresentação envolvente e precisa; dialoga com as perguntas; reconhece limites com maturidade.',
    ]),
  },
];

export function criterioPorId(id: number): Criterio {
  return CRITERIOS.find((c) => c.id === id) ?? CRITERIOS[0];
}

export function nivelPorValor(criterio: Criterio, valor: number): NivelRubrica | undefined {
  return criterio.niveis.find((n) => n.valor === valor);
}

export function calcularNota(notas: Record<string, number>): number {
  return CRITERIOS.reduce((total, criterio) => {
    const valor = Number(notas[String(criterio.id)]);
    if (!Number.isInteger(valor) || valor < 0 || valor > 4) return total;
    return total + valor * PONTOS_POR_NIVEL;
  }, 0);
}

export function totalRespondidos(notas: Record<string, number>): number {
  return CRITERIOS.filter((criterio) => {
    const valor = Number(notas[String(criterio.id)]);
    return Number.isInteger(valor) && valor >= 0 && valor <= 4;
  }).length;
}

export function avaliacaoCompleta(notas: Record<string, number>): boolean {
  return totalRespondidos(notas) === CRITERIOS.length;
}

export function rotuloNota(nota: number): string {
  if (nota >= 90) return 'Destaque';
  if (nota >= 75) return 'Adequado';
  if (nota >= 60) return 'Em desenvolvimento';
  if (nota > 0) return 'Iniciante';
  return 'Sem nota';
}
