import type { Atribuicao, Membro, Trabalho } from '../types';

export interface AtribuicaoImportada {
  linha: number;
  email: string;
  codigo: string;
  membro: Membro;
  trabalho: Trabalho;
}

export interface ProblemaImportacao {
  linha: number;
  mensagem: string;
  conteudo: string;
}

export interface AnaliseAtribuicoes {
  validas: AtribuicaoImportada[];
  existentes: AtribuicaoImportada[];
  problemas: ProblemaImportacao[];
  emailsDesconhecidos: string[];
  codigosDesconhecidos: string[];
  trabalhosComDoisOuMais: number;
}

const CODIGO = /^\d{2}\.\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SEPARADOR = /[;\t,]/;

function chave(email: string, codigo: string): string {
  return `${email.toLowerCase()}|${codigo}`;
}

/**
 * Lê uma lista simples de atribuições (uma por linha).
 *
 * Formatos aceitos:
 *   email;codigo
 *   codigo;email
 *   email,codigo
 *   email<TAB>codigo
 *
 * Cabeçalhos com "email" e "codigo" são ignorados. Linhas iniciadas por #
 * também são comentários. O parser não inventa membros nem trabalhos: se o
 * e-mail ou o código não existir, a linha vira um problema para o(a) mestre ver.
 */
export function analisarAtribuicoes(
  texto: string,
  membros: Membro[],
  trabalhos: Trabalho[],
  atribuicoes: Atribuicao[],
): AnaliseAtribuicoes {
  const mapaEmail = new Map(
    membros.map((membro) => [membro.email.trim().toLowerCase(), membro]),
  );
  const mapaCodigo = new Map(
    trabalhos.map((trabalho) => [trabalho.codigo.trim(), trabalho]),
  );
  const jaAtribuidas = new Set(
    atribuicoes.map((a) => `${a.trabalhoId}|${a.avaliadorId}`),
  );
  const vistos = new Set<string>();
  const validas: AtribuicaoImportada[] = [];
  const existentes: AtribuicaoImportada[] = [];
  const problemas: ProblemaImportacao[] = [];
  const emailsDesconhecidos = new Set<string>();
  const codigosDesconhecidos = new Set<string>();

  const linhas = texto.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  linhas.forEach((bruta, indice) => {
    const numeroLinha = indice + 1;
    const conteudo = bruta.replace(/^\uFEFF/, '').trim();
    if (!conteudo || conteudo.startsWith('#')) return;

    const campos = conteudo.split(SEPARADOR).map((campo) => campo.trim());
    if (campos.length < 2) {
      problemas.push({
        linha: numeroLinha,
        mensagem: 'Use o formato e-mail;código (ou código;e-mail).',
        conteudo,
      });
      return;
    }

    const cabecalho = campos.some((campo) => /^e-?mail$/i.test(campo));
    if (cabecalho && campos.some((campo) => /^c[oó]digo$/i.test(campo))) return;

    const email = campos.find((campo) => campo.includes('@'))?.toLowerCase() ?? '';
    const codigo = campos.find((campo) => CODIGO.test(campo)) ?? '';

    if (!EMAIL.test(email)) {
      problemas.push({
        linha: numeroLinha,
        mensagem: 'E-mail inválido ou ausente.',
        conteudo,
      });
      return;
    }
    if (!codigo) {
      problemas.push({
        linha: numeroLinha,
        mensagem: 'Código do trabalho inválido. Use o formato 01.01.',
        conteudo,
      });
      return;
    }

    const chaveLinha = chave(email, codigo);
    if (vistos.has(chaveLinha)) {
      problemas.push({
        linha: numeroLinha,
        mensagem: 'Linha repetida na lista.',
        conteudo,
      });
      return;
    }
    vistos.add(chaveLinha);

    const membro = mapaEmail.get(email);
    if (!membro) {
      emailsDesconhecidos.add(email);
      problemas.push({
        linha: numeroLinha,
        mensagem: `Avaliador não cadastrado: ${email}. Cadastre o membro primeiro.`,
        conteudo,
      });
      return;
    }
    if (!membro.ativo) {
      problemas.push({
        linha: numeroLinha,
        mensagem: `${membro.nome} está inativo(a); reative o cadastro antes de atribuir.`,
        conteudo,
      });
      return;
    }

    const trabalho = mapaCodigo.get(codigo);
    if (!trabalho) {
      codigosDesconhecidos.add(codigo);
      problemas.push({
        linha: numeroLinha,
        mensagem: `Trabalho ${codigo} não encontrado na base.`,
        conteudo,
      });
      return;
    }

    const item: AtribuicaoImportada = {
      linha: numeroLinha,
      email,
      codigo,
      membro,
      trabalho,
    };

    if (jaAtribuidas.has(`${trabalho.id}|${membro.id}`)) {
      existentes.push(item);
      return;
    }

    validas.push(item);
    jaAtribuidas.add(`${trabalho.id}|${membro.id}`);
  });

  const trabalhosComDoisOuMais = new Set(
    validas
      .filter((item) => {
        const atuais = atribuicoes.filter((a) => a.trabalhoId === item.trabalho.id).length;
        const novas = validas.filter((v) => v.trabalho.id === item.trabalho.id).length;
        return atuais + novas >= 2;
      })
      .map((item) => item.trabalho.id),
  ).size;

  return {
    validas,
    existentes,
    problemas,
    emailsDesconhecidos: [...emailsDesconhecidos],
    codigosDesconhecidos: [...codigosDesconhecidos],
    trabalhosComDoisOuMais,
  };
}

export function modeloAtribuicoes(): string {
  return [
    '# Modelo de importação de atribuições',
    '# Uma linha por vínculo. Linhas com # são ignoradas.',
    'email;codigo',
    'avaliador@ufjf.br;01.01',
    'outro.avaliador@ufjf.br;01.01',
    '',
  ].join('\n');
}
