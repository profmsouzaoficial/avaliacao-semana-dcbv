#!/usr/bin/env node
/**
 * Importa os 102 trabalhos aprovados do parecer oficial e as 95 atribuições
 * do PDF "Trabalhos por avaliador" para o Supabase.
 *
 * O que este script NÃO faz:
 *   - não apaga trabalhos, avaliações ou atribuições existentes;
 *   - não altera a categoria de trabalhos que já estão no banco;
 *   - não redefine senhas nem cria usuários do Auth.
 *
 * O parecer/planilha oficiais informam código, título, sessão, autoria e
 * instituição, mas NÃO informam a categoria metodológica (1–5). Por isso os
 * trabalhos novos entram com categoria 1 e uma observação explícita para a
 * comissão confirmar na Curadoria. A interface mostra "A confirmar" para
 * esses registros (ver src/data/event.ts).
 *
 * Uso:
 *   npm run dados:importar              # conferência (não grava)
 *   npm run dados:importar -- --aplicar # grava no Supabase
 *
 * Pré-requisitos:
 *   - supabase/migrations/0001_init.sql aplicado;
 *   - seed_avaliadores.sql aplicado (perfis em public.avaliadores);
 *   - SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.
 *
 * A chave service_role nunca deve ir ao front-end, ao Vercel ou ao Git.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
carregarEnvLocal(resolve(RAIZ, '.env.local'));

const aplicar = process.argv.includes('--aplicar');
const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const chave =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  '';

const CAMINHO_DADOS = resolve(RAIZ, 'supabase/dados/trabalhos_oficiais.json');
const CAMINHO_SEED = resolve(RAIZ, 'supabase/seed_avaliadores.sql');
const MARCADOR_CATEGORIA =
  'Categoria metodológica a confirmar: o formulário oficial não informa a categoria (1–5). Preencha na Curadoria antes da avaliação.';

if (!url || !chave) {
  console.error('\nERRO: faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY).');
  console.error('Coloque a chave service_role/secret apenas no .env.local, que é ignorado pelo git.\n');
  process.exit(1);
}
if (chavePublica(chave)) {
  console.error('\nERRO: esta é uma chave pública (anon/publishable). Use a service_role/secret.\n');
  process.exit(1);
}
if (!existsSync(CAMINHO_DADOS)) {
  console.error(`\nERRO: arquivo de dados não encontrado: ${CAMINHO_DADOS}\n`);
  process.exit(1);
}

const admin = createClient(url, chave, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const trabalhosOficiais = JSON.parse(readFileSync(CAMINHO_DADOS, 'utf8'));
if (!Array.isArray(trabalhosOficiais) || trabalhosOficiais.length !== 102) {
  console.error(`\nERRO: esperava 102 trabalhos no JSON; encontrei ${trabalhosOficiais?.length ?? 0}.\n`);
  process.exit(1);
}

const codigos = new Set();
for (const trabalho of trabalhosOficiais) {
  if (!/^\d{2}\.\d{2}$/.test(trabalho.codigo) || trabalho.id !== trabalho.codigo) {
    console.error(`\nERRO: trabalho com id/código inválido: ${JSON.stringify(trabalho)}`);
    process.exit(1);
  }
  if (trabalho.sessao < 1 || trabalho.sessao > 7) {
    console.error(`\nERRO: sessão inválida em ${trabalho.codigo}: ${trabalho.sessao}`);
    process.exit(1);
  }
  if (codigos.has(trabalho.codigo)) {
    console.error(`\nERRO: código duplicado no JSON: ${trabalho.codigo}`);
    process.exit(1);
  }
  codigos.add(trabalho.codigo);
}

const atribuicoesPdf = lerAtribuicoesDoSeed();
if (atribuicoesPdf.length !== 95) {
  console.error(`\nERRO: esperava 95 atribuições no seed; encontrei ${atribuicoesPdf.length}.\n`);
  process.exit(1);
}

let existentes;
let avaliadores;
let atribuicoesAtuais;
let avaliacoesAtuais;
try {
  const [rTrabalhos, rAvaliadores, rAtribuicoes, rAvaliacoes] = await Promise.all([
    admin.from('trabalhos').select('*'),
    admin.from('avaliadores').select('id,nome,email,ativo'),
    admin.from('atribuicoes').select('trabalho_id,avaliador_id'),
    admin.from('avaliacoes').select('trabalho_id,avaliador_id'),
  ]);
  if (rTrabalhos.error) throw rTrabalhos.error;
  if (rAvaliadores.error) throw rAvaliadores.error;
  if (rAtribuicoes.error) throw rAtribuicoes.error;
  if (rAvaliacoes.error) throw rAvaliacoes.error;
  existentes = rTrabalhos.data ?? [];
  avaliadores = rAvaliadores.data ?? [];
  atribuicoesAtuais = rAtribuicoes.data ?? [];
  avaliacoesAtuais = rAvaliacoes.data ?? [];
} catch (erro) {
  console.error(`\nERRO ao ler o Supabase: ${erro.message ?? erro}\n`);
  process.exit(1);
}

const trabalhosPorCodigo = new Map(existentes.map((t) => [t.codigo, t]));
const avaliadoresPorEmail = new Map(
  avaliadores
    .filter((a) => a.ativo)
    .map((a) => [String(a.email ?? '').trim().toLowerCase(), a]),
);

const novos = trabalhosOficiais.filter((t) => !trabalhosPorCodigo.has(t.codigo));
const jaExistentes = trabalhosOficiais.filter((t) => trabalhosPorCodigo.has(t.codigo));

const linhasParaGravar = trabalhosOficiais.map((oficial) => {
  const atual = trabalhosPorCodigo.get(oficial.codigo);
  if (!atual) {
    return paraLinhaBanco({
      ...oficial,
      categoria: 1,
      observacoes: MARCADOR_CATEGORIA,
    });
  }
  return paraLinhaBanco({
    ...trabalhoDeLinhaBanco(atual),
    apresentador: atual.apresentador || oficial.apresentador,
    autores: atual.autores || oficial.autores,
    instituicao: atual.instituicao || oficial.instituicao,
  });
});

const chavesAtuais = new Set(atribuicoesAtuais.map((a) => `${a.trabalho_id}:${a.avaliador_id}`));
const atribuicoesNovas = [];
const atribuicoesRemover = [];
const atribuicoesSemTrabalho = [];
const atribuicoesSemAvaliador = [];
const chavesAvaliadas = new Set(
  avaliacoesAtuais.map((a) => `${a.trabalho_id}:${a.avaliador_id}`),
);

for (const item of atribuicoesPdf) {
  const candidatos = [item.codigo, item.codigoAlternativo].filter(Boolean);
  const trabalho = candidatos
    .map((codigo) => trabalhosOficiais.find((t) => t.codigo === codigo))
    .find(Boolean);
  const avaliador = avaliadoresPorEmail.get(item.email.toLowerCase());

  if (!trabalho) {
    atribuicoesSemTrabalho.push(item);
    continue;
  }
  if (!avaliador) {
    atribuicoesSemAvaliador.push(item);
    continue;
  }

  const chave = `${trabalho.id}:${avaliador.id}`;
  const trabalhoAlternativo = item.codigoAlternativo
    ? trabalhosOficiais.find((t) => t.codigo === item.codigoAlternativo)
    : null;

  // O banco antigo pode ter a atribuição no código alternativo (07.03) porque
  // o trabalho 07.04 ainda não existia. Se o código exato já existe, a
  // atribuição no alternativo é legado e deve sair para não duplicar o mesmo
  // banner. Nunca removemos uma atribuição que já tenha avaliação registrada.
  if (trabalho.codigo === item.codigo && trabalhoAlternativo) {
    const chaveAlternativa = `${trabalhoAlternativo.id}:${avaliador.id}`;
    if (chavesAtuais.has(chaveAlternativa)) {
      if (chavesAvaliadas.has(chaveAlternativa)) {
        console.error(
          `\nERRO: a atribuição legada ${trabalhoAlternativo.codigo} → ${avaliador.nome} já tem avaliação.`,
        );
        console.error('Resolva manualmente na Curadoria antes de rodar a importação.\n');
        process.exit(1);
      }
      atribuicoesRemover.push({
        trabalho_id: trabalhoAlternativo.id,
        avaliador_id: avaliador.id,
        rotulo: `${trabalhoAlternativo.codigo} → ${avaliador.nome}`,
      });
      chavesAtuais.delete(chaveAlternativa);
    }
  }

  if (chavesAtuais.has(chave)) continue;
  chavesAtuais.add(chave);
  atribuicoesNovas.push({
    id: chave,
    trabalho_id: trabalho.id,
    avaliador_id: avaliador.id,
  });
}

const porTrabalho = new Map();
for (const a of atribuicoesAtuais) porTrabalho.set(a.trabalho_id, (porTrabalho.get(a.trabalho_id) ?? 0) + 1);
for (const a of atribuicoesNovas) porTrabalho.set(a.trabalho_id, (porTrabalho.get(a.trabalho_id) ?? 0) + 1);
for (const a of atribuicoesRemover) porTrabalho.set(a.trabalho_id, (porTrabalho.get(a.trabalho_id) ?? 0) - 1);
const semAtribuicao = trabalhosOficiais.filter((t) => (porTrabalho.get(t.id) ?? 0) === 0).length;
const comUma = trabalhosOficiais.filter((t) => porTrabalho.get(t.id) === 1).length;
const comDuasOuMais = trabalhosOficiais.filter((t) => (porTrabalho.get(t.id) ?? 0) >= 2).length;

console.log('\n=== Dados oficiais da I Semana do DCBV ===');
console.log(`Modo: ${aplicar ? 'APLICAR (grava no Supabase)' : 'conferência (não grava nada)'}`);
console.log(`Projeto: ${url}`);
console.log(`Trabalhos oficiais no JSON: ${trabalhosOficiais.length}`);
console.log(`Já existem no banco: ${jaExistentes.length}`);
console.log(`Serão inseridos: ${novos.length}`);
console.log(`Atribuições do PDF: ${atribuicoesPdf.length}`);
console.log(`Já existem no banco: ${atribuicoesAtuais.length}`);
console.log(`Serão inseridas: ${atribuicoesNovas.length}`);
console.log(`Atribuições legadas a remover: ${atribuicoesRemover.length}`);
if (atribuicoesRemover.length) {
  for (const item of atribuicoesRemover) console.log(`  - ${item.rotulo}`);
}
console.log(`Trabalhos sem atribuição após a carga: ${semAtribuicao}`);
console.log(`Com 1 avaliador: ${comUma}`);
console.log(`Com 2+ avaliadores: ${comDuasOuMais}`);

if (atribuicoesSemTrabalho.length) {
  console.log('\nATENÇÃO: atribuições sem trabalho correspondente:');
  for (const item of atribuicoesSemTrabalho) console.log(`  - ${item.codigo} (${item.email})`);
}
if (atribuicoesSemAvaliador.length) {
  console.log('\nATENÇÃO: atribuições sem avaliador ativo correspondente:');
  for (const item of atribuicoesSemAvaliador) console.log(`  - ${item.codigo}: ${item.email}`);
}
if (atribuicoesSemTrabalho.length || atribuicoesSemAvaliador.length) {
  console.error('\nERRO: há atribuições não resolvidas. Nada foi gravado.\n');
  process.exit(1);
}

if (!aplicar) {
  console.log('\nConferência concluída. Para gravar: npm run dados:importar -- --aplicar\n');
  process.exit(0);
}

try {
  const { error: erroTrabalhos } = await admin
    .from('trabalhos')
    .upsert(linhasParaGravar, { onConflict: 'id' });
  if (erroTrabalhos) throw erroTrabalhos;

  if (atribuicoesNovas.length) {
    const { error: erroAtribuicoes } = await admin
      .from('atribuicoes')
      .insert(atribuicoesNovas);
    if (erroAtribuicoes) throw erroAtribuicoes;
  }

  for (const item of atribuicoesRemover) {
    const { error: erroRemocao } = await admin
      .from('atribuicoes')
      .delete()
      .eq('trabalho_id', item.trabalho_id)
      .eq('avaliador_id', item.avaliador_id);
    if (erroRemocao) throw erroRemocao;
  }
} catch (erro) {
  console.error(`\nERRO ao gravar: ${erro.message ?? erro}\n`);
  process.exit(1);
}

const { count: totalTrabalhos, error: e1 } = await admin
  .from('trabalhos')
  .select('id', { count: 'exact', head: true });
const { count: totalAtribuicoes, error: e2 } = await admin
  .from('atribuicoes')
  .select('id', { count: 'exact', head: true });
if (e1 || e2) {
  console.error(`\nCarga concluída, mas falhou a conferência final: ${(e1 ?? e2).message}\n`);
  process.exit(1);
}

console.log(`\nCarga concluída. Trabalhos no banco: ${totalTrabalhos}. Atribuições: ${totalAtribuicoes}.`);
console.log('Os trabalhos novos aparecem com "Categoria a confirmar" até a comissão revisar.\n');

function trabalhoDeLinhaBanco(row) {
  return {
    id: row.id,
    codigo: row.codigo,
    titulo: row.titulo,
    sessao: Number(row.sessao),
    categoria: Number(row.categoria),
    apresentador: row.apresentador ?? '',
    autores: row.autores ?? '',
    orientador: row.orientador ?? '',
    instituicao: row.instituicao ?? '',
    periodo: row.periodo ?? '',
    nivel: row.nivel ?? 'outro',
    resumo: row.resumo ?? '',
    linkPdf: row.link_pdf ?? '',
    observacoes: row.observacoes ?? '',
  };
}

function paraLinhaBanco(trabalho) {
  return {
    id: trabalho.id,
    codigo: trabalho.codigo,
    titulo: trabalho.titulo,
    sessao: trabalho.sessao,
    categoria: trabalho.categoria,
    apresentador: trabalho.apresentador,
    autores: trabalho.autores,
    orientador: trabalho.orientador,
    instituicao: trabalho.instituicao,
    periodo: trabalho.periodo,
    nivel: trabalho.nivel,
    resumo: trabalho.resumo,
    link_pdf: trabalho.linkPdf,
    observacoes: trabalho.observacoes,
  };
}

function lerAtribuicoesDoSeed() {
  if (!existsSync(CAMINHO_SEED)) {
    console.error(`\nERRO: seed não encontrado: ${CAMINHO_SEED}\n`);
    process.exit(1);
  }
  const sql = readFileSync(CAMINHO_SEED, 'utf8');
  const inicio = sql.indexOf('with lista_pdf (codigo, email, codigo_alternativo) as (');
  const fim = sql.indexOf('\nresolvidas as (', inicio);
  if (inicio < 0 || fim < 0) {
    console.error('\nERRO: não encontrei a lista de atribuições no seed_avaliadores.sql.\n');
    process.exit(1);
  }
  const trecho = sql.slice(inicio, fim);
  const linhas = [...trecho.matchAll(/^\('(\d{2}\.\d{2})',\s*'([^']+)',\s*(null|'([^']*)')\),?$/gm)];
  return linhas.map((m) => ({
    codigo: m[1],
    email: m[2].trim().toLowerCase(),
    codigoAlternativo: m[4] || null,
  }));
}

function chavePublica(valor) {
  if (/^sb_publishable_/i.test(valor)) return true;
  const partes = valor.split('.');
  if (partes.length !== 3) return false;
  try {
    const payload = JSON.parse(Buffer.from(partes[1], 'base64url').toString('utf8'));
    return payload.role === 'anon';
  } catch {
    return false;
  }
}

function carregarEnvLocal(caminho) {
  if (!existsSync(caminho)) return;
  for (const linha of readFileSync(caminho, 'utf8').split(/\r?\n/)) {
    const limpa = linha.trim();
    if (!limpa || limpa.startsWith('#')) continue;
    const igual = limpa.indexOf('=');
    if (igual < 0) continue;
    const nome = limpa.slice(0, igual).trim();
    let valor = limpa.slice(igual + 1).trim();
    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }
    if (!(nome in process.env)) process.env[nome] = valor;
  }
}
