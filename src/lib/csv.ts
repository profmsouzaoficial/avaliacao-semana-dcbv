import { CATEGORIAS, SESSOES, categoriaPorNumero, sessaoPorNumero } from '../data/event';
import type { NivelParticipante, RankingItem, Trabalho } from '../types';

export const COLUNAS_TRABALHOS = [
  'codigo',
  'titulo',
  'sessao',
  'categoria',
  'apresentador',
  'autores',
  'orientador',
  'instituicao',
  'periodo',
  'nivel',
  'resumo',
  'link_pdf',
  'observacoes',
] as const;

export const MODELO_CSV = `${COLUNAS_TRABALHOS.join(';')}
01.01;Título do trabalho;1;3;Nome do(a) apresentador(a);Autores separados por vírgula;Orientador(a);UFJF – Campus GV;2º;graduacao;Resumo breve (opcional);https://...;Observações internas (opcional)
`;

function detectarSeparador(linha: string): string {
  const candidatos = [';', ',', '\t'];
  let melhor = ';';
  let maior = -1;
  candidatos.forEach((sep) => {
    const total = linha.split(sep).length;
    if (total > maior) {
      maior = total;
      melhor = sep;
    }
  });
  return melhor;
}

export function parseCsv(texto: string): string[][] {
  const limpo = texto.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const primeiraLinha = limpo.split('\n').find((l) => l.trim().length > 0) ?? '';
  const separador = detectarSeparador(primeiraLinha);
  const linhas: string[][] = [];
  let atual: string[] = [];
  let campo = '';
  let dentroDeAspas = false;

  for (let i = 0; i < limpo.length; i += 1) {
    const char = limpo[i];
    if (dentroDeAspas) {
      if (char === '"') {
        if (limpo[i + 1] === '"') {
          campo += '"';
          i += 1;
        } else {
          dentroDeAspas = false;
        }
      } else {
        campo += char;
      }
      continue;
    }
    if (char === '"') {
      dentroDeAspas = true;
    } else if (char === separador) {
      atual.push(campo.trim());
      campo = '';
    } else if (char === '\n') {
      atual.push(campo.trim());
      if (atual.some((c) => c.length > 0)) linhas.push(atual);
      atual = [];
      campo = '';
    } else {
      campo += char;
    }
  }
  if (campo.length > 0 || atual.length > 0) {
    atual.push(campo.trim());
    if (atual.some((c) => c.length > 0)) linhas.push(atual);
  }
  return linhas;
}

function normalizarCabecalho(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

const ALIASES: Record<string, string> = {
  codigo: 'codigo',
  cod: 'codigo',
  id: 'codigo',
  titulo: 'titulo',
  titulo_do_trabalho: 'titulo',
  sessao: 'sessao',
  sessao_tematica: 'sessao',
  categoria: 'categoria',
  apresentador: 'apresentador',
  apresentadora: 'apresentador',
  autor_apresentador: 'apresentador',
  autores: 'autores',
  autor: 'autores',
  orientador: 'orientador',
  orientadora: 'orientador',
  instituicao: 'instituicao',
  instituicoes: 'instituicao',
  periodo: 'periodo',
  nivel: 'nivel',
  resumo: 'resumo',
  link_pdf: 'link_pdf',
  pdf: 'link_pdf',
  link: 'link_pdf',
  observacoes: 'observacoes',
  observacao: 'observacoes',
};

export interface ResultadoImportacao {
  trabalhos: Trabalho[];
  erros: string[];
  avisos: string[];
}

function normalizarNivel(valor: string): NivelParticipante {
  const v = normalizarCabecalho(valor);
  if (v.startsWith('gradua')) return 'graduacao';
  if (v.startsWith('pos') || v.includes('mestrado') || v.includes('doutorado')) return 'pos-graduacao';
  if (v.startsWith('docen') || v.startsWith('prof')) return 'docente';
  return 'outro';
}

function numeroSessao(valor: string): number | null {
  const n = Number(valor.match(/\d+/)?.[0]);
  if (!Number.isInteger(n) || n < 1 || n > 7) return null;
  return n;
}

function numeroCategoria(valor: string): number | null {
  const n = Number(valor.match(/\d+/)?.[0]);
  if (!Number.isInteger(n) || n < 1 || n > 5) return null;
  return n;
}

export function csvParaTrabalhos(texto: string): ResultadoImportacao {
  const linhas = parseCsv(texto);
  const erros: string[] = [];
  const avisos: string[] = [];
  if (linhas.length < 2) {
    return { trabalhos: [], erros: ['O arquivo está vazio ou não tem cabeçalho.'], avisos };
  }

  const cabecalho = linhas[0].map((c) => ALIASES[normalizarCabecalho(c)] ?? normalizarCabecalho(c));
  const obrigatorias = ['codigo', 'titulo', 'sessao', 'categoria'];
  obrigatorias.forEach((coluna) => {
    if (!cabecalho.includes(coluna)) {
      erros.push(`Coluna obrigatória ausente: ${coluna}.`);
    }
  });
  if (erros.length > 0) return { trabalhos: [], erros, avisos };

  const vistos = new Set<string>();
  const trabalhos: Trabalho[] = [];

  linhas.slice(1).forEach((linha, indice) => {
    const numeroLinha = indice + 2;
    const registro: Record<string, string> = {};
    cabecalho.forEach((coluna, i) => {
      registro[coluna] = (linha[i] ?? '').trim();
    });
    const codigo = (registro.codigo || '').replace(/\s+/g, '');
    const titulo = registro.titulo || '';
    if (!codigo && !titulo) return;
    if (!/^\d{2}\.\d{2}$/.test(codigo)) {
      erros.push(`Linha ${numeroLinha}: código "${codigo}" fora do padrão NN.NN.`);
      return;
    }
    if (vistos.has(codigo)) {
      erros.push(`Linha ${numeroLinha}: código ${codigo} duplicado no arquivo.`);
      return;
    }
    if (!titulo) {
      erros.push(`Linha ${numeroLinha}: título vazio.`);
      return;
    }
    const sessao = numeroSessao(registro.sessao || '');
    if (!sessao) {
      erros.push(`Linha ${numeroLinha}: sessão inválida (use 1 a 7).`);
      return;
    }
    const categoria = numeroCategoria(registro.categoria || '');
    if (!categoria) {
      erros.push(`Linha ${numeroLinha}: categoria inválida (use 1 a 5).`);
      return;
    }
    const nivel = normalizarNivel(registro.nivel || '');
    if (!registro.apresentador) {
      avisos.push(`Linha ${numeroLinha}: apresentador(a) não informado.`);
    }
    vistos.add(codigo);
    trabalhos.push({
      id: codigo,
      codigo,
      titulo,
      sessao,
      categoria,
      apresentador: registro.apresentador || '',
      autores: registro.autores || '',
      orientador: registro.orientador || '',
      instituicao: registro.instituicao || '',
      periodo: registro.periodo || '',
      nivel,
      resumo: registro.resumo || '',
      linkPdf: registro.link_pdf || '',
      observacoes: registro.observacoes || '',
    });
  });

  return { trabalhos, erros, avisos };
}

function escaparCampoCsv(valor: string): string {
  if (/[;"\n\r]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export function trabalhosParaCsv(trabalhos: Trabalho[]): string {
  const linhas = [COLUNAS_TRABALHOS.join(';')];
  trabalhos.forEach((t) => {
    linhas.push(
      [
        t.codigo,
        t.titulo,
        String(t.sessao),
        String(t.categoria),
        t.apresentador,
        t.autores,
        t.orientador,
        t.instituicao,
        t.periodo,
        t.nivel,
        t.resumo,
        t.linkPdf,
        t.observacoes,
      ]
        .map(escaparCampoCsv)
        .join(';'),
    );
  });
  return `${linhas.join('\n')}\n`;
}

export function rankingParaCsv(ranking: RankingItem[]): string {
  const cabecalho = [
    'posicao',
    'codigo',
    'titulo',
    'sessao',
    'categoria',
    'apresentador',
    'media_final',
    'criterio_1',
    'criterio_2',
    'criterio_3',
    'criterio_4',
    'criterio_5',
    'avaliacoes_concluidas',
    'avaliacoes_atribuidas',
    'votos_mencao',
    'elegivel_destaque_formativo',
  ];
  const linhas = [cabecalho.join(';')];
  ranking.forEach((item) => {
    linhas.push(
      [
        item.posicao ?? '',
        item.trabalho.codigo,
        item.trabalho.titulo,
        sessaoPorNumero(item.trabalho.sessao).nome,
        categoriaPorNumero(item.trabalho.categoria).nome,
        item.trabalho.apresentador,
        item.media !== null ? item.media.toFixed(2).replace('.', ',') : '',
        ...[1, 2, 3, 4, 5].map((id) =>
          item.mediasPorCriterio[id] !== null
            ? (item.mediasPorCriterio[id] as number).toFixed(1).replace('.', ',')
            : '',
        ),
        item.concluidas,
        item.atribuidas,
        item.votosMencao,
        item.elegivelDestaqueFormativo ? 'sim' : 'não',
      ]
        .map((v) => escaparCampoCsv(String(v)))
        .join(';'),
    );
  });
  return `${linhas.join('\n')}\n`;
}

export function baixarArquivo(nome: string, conteudo: string, tipo = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([`\uFEFF${conteudo}`], { type: tipo });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function resumoListas(): string {
  const sessoes = SESSOES.map((s) => `${s.numero} = ${s.nome}`).join('\n');
  const categorias = CATEGORIAS.map((c) => `${c.numero} = ${c.nome}`).join('\n');
  return `Sessões temáticas:\n${sessoes}\n\nCategorias:\n${categorias}`;
}
