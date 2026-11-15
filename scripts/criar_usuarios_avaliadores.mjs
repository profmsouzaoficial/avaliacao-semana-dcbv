#!/usr/bin/env node
/**
 * Cria (ou redefine) os usuários do Supabase Auth dos avaliadores ativos.
 *
 * Política deste script: a senha inicial é o próprio e-mail do avaliador,
 * em minúsculas, exatamente como está em public.avaliadores.email.
 *
 * ATENÇÃO: senha = e-mail é uma prática insegura. Qualquer pessoa que saiba
 * o e-mail consegue entrar. O app mostra os e-mails dos membros ativos para
 * qualquer usuário autenticado; portanto, na prática, um avaliador pode entrar
 * na conta de outro. Use apenas se a comissão aceitar esse risco.
 *
 * Uso:
 *   npm run auth:senhas                  # modo conferência (não altera nada)
 *   npm run auth:senhas -- --aplicar     # cria/redefine de verdade
 *   npm run auth:senhas -- --aplicar --incluir-masters
 *
 * Pré-requisitos:
 *   - seed_avaliadores.sql já executado (perfis em public.avaliadores);
 *   - SUPABASE_URL e uma chave service_role/secret no .env.local ou no ambiente.
 *
 * A chave service_role NUNCA deve ir para o front-end, para o Vercel ou para
 * o repositório. Este script roda somente na máquina do administrador.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
carregarEnvLocal(resolve(RAIZ, '.env.local'));

const aplicar = process.argv.includes('--aplicar');
const incluirMasters = process.argv.includes('--incluir-masters');
const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const chave =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  '';

if (!url || !chave) {
  console.error('\nERRO: faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY).');
  console.error('Coloque a chave service_role/secret apenas no .env.local, que é ignorado pelo git.');
  console.error('Nunca use o prefixo VITE_ e nunca envie essa chave ao navegador ou ao Vercel.\n');
  process.exit(1);
}

if (chavePublica(chave)) {
  console.error('\nERRO: a chave informada é anon/publishable, não service_role/secret.');
  console.error('O Admin API precisa de uma chave secreta. Não use a chave pública do app.\n');
  process.exit(1);
}

const admin = createClient(url, chave, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let consulta = admin
  .from('avaliadores')
  .select('id, nome, email, papel, ativo, user_id')
  .eq('ativo', true);

if (!incluirMasters) consulta = consulta.eq('papel', 'avaliador');

const { data: perfis, error: erroPerfis } = await consulta.order('nome');
if (erroPerfis) {
  console.error(`\nERRO ao ler public.avaliadores: ${erroPerfis.message}\n`);
  process.exit(1);
}

if (!perfis?.length) {
  console.error('\nERRO: nenhum perfil ativo encontrado.');
  console.error('Rode primeiro supabase/seed_avaliadores.sql e confira public.avaliadores.\n');
  process.exit(1);
}

const alvos = [];
const vistos = new Set();
for (const perfil of perfis) {
  const email = String(perfil.email ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(`ERRO: e-mail inválido no perfil ${perfil.nome ?? perfil.id}: ${JSON.stringify(perfil.email)}`);
    process.exit(1);
  }
  if (vistos.has(email)) {
    console.error(`ERRO: e-mail duplicado em public.avaliadores: ${email}`);
    process.exit(1);
  }
  vistos.add(email);
  alvos.push({ ...perfil, email });
}

let usuarios;
try {
  usuarios = await listarUsuarios();
} catch (erro) {
  console.error(`\nERRO ao listar usuários do Auth: ${erro.message}\n`);
  process.exit(1);
}

const porEmail = new Map(
  usuarios
    .filter((u) => u.email)
    .map((u) => [String(u.email).toLowerCase(), u]),
);

const acoes = alvos.map((perfil) => {
  const usuario = porEmail.get(perfil.email);
  return {
    perfil,
    usuario,
    tipo: usuario ? 'redefinir' : 'criar',
    senha: perfil.email,
  };
});

console.log(`\nProjeto: ${url}`);
console.log(`Perfis ativos considerados: ${alvos.length}${incluirMasters ? ' (incluindo masters)' : ' (somente papel=avaliador)'}`);
console.log(`Já têm conta no Auth: ${acoes.filter((a) => a.tipo === 'redefinir').length}`);
console.log(`Serão criados: ${acoes.filter((a) => a.tipo === 'criar').length}`);
console.log('Senha inicial: o próprio e-mail, em minúsculas.\n');

for (const acao of acoes) {
  console.log(`  [${acao.tipo === 'criar' ? 'criar' : 'redefinir'}] ${acao.perfil.email} — ${acao.perfil.nome}`);
}

if (!aplicar) {
  console.log('\nModo conferência: nada foi alterado.');
  console.log('Para aplicar: npm run auth:senhas -- --aplicar');
  console.log('Para incluir também os masters: npm run auth:senhas -- --aplicar --incluir-masters\n');
  process.exit(0);
}

console.log('\nAplicando... (a senha de contas existentes será substituída pelo e-mail)\n');
let criados = 0;
let redefinidos = 0;
let falhas = 0;

for (const acao of acoes) {
  try {
    if (acao.usuario) {
      const { error } = await admin.auth.admin.updateUserById(acao.usuario.id, {
        password: acao.senha,
        email_confirm: true,
      });
      if (error) throw error;
      redefinidos++;
      console.log(`  ok  senha redefinida  ${acao.perfil.email}`);
    } else {
      const { error } = await admin.auth.admin.createUser({
        email: acao.perfil.email,
        password: acao.senha,
        email_confirm: true,
        user_metadata: { nome: acao.perfil.nome },
      });
      if (error) throw error;
      criados++;
      console.log(`  ok  conta criada     ${acao.perfil.email}`);
    }
  } catch (erro) {
    falhas++;
    console.error(`  ERRO ${acao.perfil.email}: ${erro.message}`);
  }
}

console.log(`\nResumo: ${criados} criada(s), ${redefinidos} senha(s) redefinida(s), ${falhas} falha(s).`);
console.log('A senha inicial de cada conta é o próprio e-mail, em minúsculas.');
console.log('No primeiro login, vincular_meu_usuario() liga o Auth ao perfil pelo e-mail.\n');
if (falhas) process.exitCode = 1;

function carregarEnvLocal(caminho) {
  if (!existsSync(caminho)) return;
  for (const linha of readFileSync(caminho, 'utf8').split(/\r?\n/)) {
    const texto = linha.trim();
    if (!texto || texto.startsWith('#')) continue;
    const match = texto.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let valor = match[2].trim();
    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }
    if (process.env[match[1]] === undefined) process.env[match[1]] = valor;
  }
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

async function listarUsuarios() {
  const todos = [];
  for (let pagina = 1; pagina <= 100; pagina++) {
    const { data, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: 1000 });
    if (error) throw new Error(error.message);
    const usuarios = data?.users ?? [];
    todos.push(...usuarios);
    if (usuarios.length < 1000) break;
  }
  return todos;
}
