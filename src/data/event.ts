import type { CategoriaTrabalho, SessaoTematica } from '../types';

export const EVENTO = {
  nome: 'I Semana do DCBV',
  subtitulo:
    'Bases da Saúde: onde a ciência básica encontra a formação profissional',
  departamento: 'Departamento de Ciências Básicas da Vida (DCBV)',
  instituicao: 'Universidade Federal de Juiz de Fora — Campus Governador Valadares',
  siglaInstituicao: 'UFJF · Campus GV',
  datas: '16 a 19 de novembro de 2026',
  dataCurta: '16–19 nov. 2026',
  local: 'Campus Governador Valadares — UFJF',
  cidade: 'Governador Valadares/MG',
  contato: 'semanadcbv@gmail.com',
  regulamento: 'Regulamento da I Semana do DCBV, de 01/09/2026',
  ano: 2026,
  links: {
    site: 'https://www2.ufjf.br/dcbv/evento-cientifico-dcbv/',
    regulamento:
      'http://www2.ufjf.br/dcbv/wp-content/uploads/sites/546/2026/09/REGULAMENTO_V%C3%A1lido.pdf',
    orientacoesResumo:
      'http://www2.ufjf.br/dcbv/wp-content/uploads/sites/546/2026/09/Orienta%C3%A7%C3%B5es_resumo.pdf',
    orientacoesPoster:
      'http://www2.ufjf.br/dcbv/wp-content/uploads/sites/546/2026/11/Orienta%C3%A7%C3%B5es-para-apresenta%C3%A7%C3%A3o-e-confec%C3%A7%C3%A3o-de-banner.pdf',
    templatePoster:
      'http://www2.ufjf.br/dcbv/wp-content/uploads/sites/546/2026/11/Template-padr%C3%A3o-para-p%C3%B4steres-I-Bases-da-Sa%C3%BAde.pdf',
    programacao:
      'http://www2.ufjf.br/dcbv/wp-content/uploads/sites/546/2026/11/Programacao_I_Semana_DCBV_Bases_da_Saude_FINAL.pdf',
    parecer:
      'http://www2.ufjf.br/dcbv/wp-content/uploads/sites/546/2026/11/PARECER_RESUMOS1.pdf',
  },
} as const;

export const SESSOES: SessaoTematica[] = [
  {
    numero: 1,
    nome: 'Ciências Morfológicas e do Desenvolvimento',
    curto: 'Morfológicas',
    cor: 'teal',
  },
  {
    numero: 2,
    nome: 'Ciências Fisiológicas e Farmacologia',
    curto: 'Fisiológicas',
    cor: 'sky',
  },
  {
    numero: 3,
    nome: 'Doenças negligenciadas, crônicas e infecciosas',
    curto: 'Doenças',
    cor: 'rose',
  },
  {
    numero: 4,
    nome: 'Bioquímica e Biologia Molecular',
    curto: 'Bioquímica',
    cor: 'violet',
  },
  {
    numero: 5,
    nome: 'Ciências Aplicadas à Saúde',
    curto: 'Aplicadas',
    cor: 'emerald',
  },
  {
    numero: 6,
    nome: 'Atividades Práticas, Ensino e Formação na Graduação',
    curto: 'Ensino',
    cor: 'amber',
  },
  {
    numero: 7,
    nome: 'Agroecologia, Bioética e Bioestatística',
    curto: 'Agroecologia',
    cor: 'lime',
  },
];

export const CATEGORIAS: CategoriaTrabalho[] = [
  {
    numero: 1,
    nome: 'Estudo de caso ou revisão de literatura',
    curto: 'Caso ou revisão',
    orientacaoMetodo:
      'Para revisão: bases e fontes consultadas, critérios de seleção e período. Para caso: contexto, sujeito(s), cuidado ético e o que o caso ensina.',
  },
  {
    numero: 2,
    nome: 'Trabalho com resultados parciais',
    curto: 'Resultados parciais',
    orientacaoMetodo:
      'O que já foi feito, o que ainda falta e como os dados serão analisados. Resultados parciais não são um defeito: são uma etapa honesta do trabalho.',
  },
  {
    numero: 3,
    nome: 'Trabalho com resultados completos',
    curto: 'Resultados completos',
    orientacaoMetodo:
      'Desenho, participantes/amostra, instrumentos, análise e limitações. Não é necessário ter estatística avançada; é necessário explicar o caminho.',
  },
  {
    numero: 4,
    nome: 'Projeto de pesquisa',
    curto: 'Projeto',
    orientacaoMetodo:
      'Pergunta, desenho previsto, etapas, cronograma, viabilidade e aspectos éticos. O projeto descreve o que será feito e por quê.',
  },
  {
    numero: 5,
    nome: 'Atividades práticas e experiências de ensino na graduação',
    curto: 'Ensino e prática',
    orientacaoMetodo:
      'Contexto, participantes, objetivos de aprendizagem, etapas, evidências do que foi aprendido e reflexão sobre a experiência.',
  },
];

export function sessaoPorNumero(numero: number): SessaoTematica {
  return SESSOES.find((s) => s.numero === numero) ?? SESSOES[0];
}

export function categoriaPorNumero(numero: number): CategoriaTrabalho {
  return CATEGORIAS.find((c) => c.numero === numero) ?? CATEGORIAS[0];
}

export const APLICACAO = {
  nome: 'Bancas DCBV',
  versao: '1.0',
  descricao:
    'Aplicativo de apoio à avaliação formativa dos banners da I Semana do DCBV.',
  aviso:
    'Instrumento pedagógico de apoio. Não substitui o barema oficial da Comissão Científica nem a deliberação soberana da comissão (Regulamento, itens 3.6, 5.5 e 7.1).',
} as const;
