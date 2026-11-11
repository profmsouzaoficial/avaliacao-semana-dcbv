#!/usr/bin/env node
/**
 * Smoke test de ponta a ponta — Bancas DCBV.
 *
 * Pré-requisitos:
 *   npm install
 *   npx playwright install chromium   (uma vez)
 *
 * O script sobe o Vite em http://127.0.0.1:3000 se ainda não houver servidor,
 * percorre o fluxo principal em modo demonstração e grava capturas em
 * e2e/artifacts/. Nenhum dado real do Supabase é tocado.
 */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const BASE = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';
const ARTIFACTS = join(process.cwd(), 'e2e', 'artifacts');
const VIEWPORT = { width: 1440, height: 1000 };

mkdirSync(ARTIFACTS, { recursive: true });

function chromiumExecutable() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }
  const cache = join(homedir(), '.cache', 'ms-playwright');
  if (!existsSync(cache)) return undefined;
  const versoes = readdirSync(cache)
    .filter((nome) => nome.startsWith('chromium-'))
    .sort()
    .reverse();
  for (const versao of versoes) {
    const caminho = join(cache, versao, 'chrome-linux64', 'chrome');
    if (existsSync(caminho)) return caminho;
  }
  return undefined;
}

async function servidorNoAr() {
  try {
    const resposta = await fetch(BASE, { signal: AbortSignal.timeout(1200) });
    return resposta.ok;
  } catch {
    return false;
  }
}

async function esperarServidor(limiteMs = 30_000) {
  const inicio = Date.now();
  while (Date.now() - inicio < limiteMs) {
    if (await servidorNoAr()) return;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`O servidor não respondeu em ${BASE}. Rode "npm run dev" e tente de novo.`);
}

async function main() {
  let servidor = null;
  if (!(await servidorNoAr())) {
    console.log('→ subindo Vite em segundo plano…');
    servidor = spawn('npm', ['run', 'dev'], {
      stdio: 'ignore',
      detached: false,
      env: { ...process.env, BROWSER: 'none' },
    });
  }
  await esperarServidor();

  const browser = await chromium.launch({
    headless: true,
    executablePath: chromiumExecutable(),
  });

  const errosDeConsole = [];

  try {
    const contexto = await browser.newContext({ viewport: VIEWPORT, locale: 'pt-BR' });
    const page = await contexto.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') errosDeConsole.push(msg.text());
    });
    page.on('pageerror', (erro) => errosDeConsole.push(erro.message));

    // 1. Login de demonstração
    await page.goto(`${BASE}/?demo=1`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Presidência da comissão/ }).click();
    await page.waitForSelector('text=Painel de consolidação');
    assert.match(await page.locator('body').innerText(), /Painel de consolidação/);
    await page.screenshot({ path: join(ARTIFACTS, '01-painel-vazio.png'), fullPage: true });

    // 2. Curadoria: abas e cadastro
    await page.getByRole('button', { name: 'Curadoria' }).click();
    await page.waitForSelector('text=Dados do evento');
    assert.match(await page.locator('body').innerText(), /20 trabalhos cadastrados/);
    await page.getByRole('button', { name: 'Novo trabalho' }).first().click();
    await page.waitForSelector('text=Cadastre um banner aprovado');
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await page.getByRole('button', { name: /Membros/ }).click();
    await page.waitForSelector('text=Novo membro');
    await page.screenshot({ path: join(ARTIFACTS, '02-curadoria-membros.png'), fullPage: true });

    // 3. Avaliador preenche os cinco critérios no nível 3
    await page.goto(`${BASE}/?demo=avaliador-demo-1`, { waitUntil: 'networkidle' });
    const secoes = page.locator('section[id^="criterio-"]');
    assert.equal(await secoes.count(), 5, 'esperava cinco critérios');
    for (let i = 0; i < 5; i += 1) {
      const secao = secoes.nth(i);
      const botaoCabecalho = secao.locator('button').first();
      if ((await botaoCabecalho.getAttribute('aria-expanded')) !== 'true') {
        await botaoCabecalho.click();
      }
      await secao.getByRole('radio', { name: /^Adequado: 15 pontos/ }).click();
    }
    const textareas = page.locator('textarea');
    await textareas.nth(0).fill('Objetivo claro; o método está descrito de forma compreensível.');
    await textareas.nth(1).fill('Informar o número de participantes e revisar a legenda da Figura 2.');
    await textareas.nth(2).fill('Trabalho adequado à categoria, com resultados bem organizados.');
    await page.getByRole('button', { name: /Concluir avaliação/ }).click();
    await page.waitForSelector('text=Avaliação concluída');
    await page.screenshot({ path: join(ARTIFACTS, '03-avaliacao-concluida.png'), fullPage: true });

    // 4. Presidência enxerga a avaliação consolidada
    await page.goto(`${BASE}/?demo=presidencia-demo`, { waitUntil: 'networkidle' });
    await page.waitForSelector('text=Painel de consolidação');
    const textoPainel = await page.locator('body').innerText();
    assert.match(textoPainel, /AVALIAÇÕES CONCLUÍDAS/i);
    assert.match(textoPainel, /01\.01/);
    await page.screenshot({ path: join(ARTIFACTS, '04-painel-1-avaliacao.png'), fullPage: true });

    // 5. Ata
    await page.getByRole('button', { name: /Gerar ata/ }).click();
    await page.waitForSelector('text=Ata de consolidação');
    assert.match(await page.locator('body').innerText(), /Ata de consolidação/);
    await page.screenshot({ path: join(ARTIFACTS, '05-ata.png'), fullPage: false });
    await page.getByRole('button', { name: 'Fechar', exact: true }).last().click();

    // 6. Mobile: sem rolagem horizontal
    const movel = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      locale: 'pt-BR',
    });
    const paginaMovel = await movel.newPage();
    await paginaMovel.goto(`${BASE}/?demo=presidencia-demo`, { waitUntil: 'networkidle' });
    await paginaMovel.waitForSelector('text=Painel de consolidação');
    const overflow = await paginaMovel.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    assert.ok(overflow <= 1, `há rolagem horizontal no mobile (${overflow}px)`);
    await paginaMovel.screenshot({ path: join(ARTIFACTS, '06-mobile.png'), fullPage: true });
    await movel.close();
    await contexto.close();

    if (errosDeConsole.length > 0) {
      console.error('Erros de console encontrados:\n' + errosDeConsole.join('\n'));
      process.exitCode = 1;
    } else {
      console.log('✓ smoke test concluído; capturas em e2e/artifacts/');
    }
  } finally {
    await browser.close();
    if (servidor) {
      servidor.kill('SIGTERM');
    }
  }
}

main().catch((erro) => {
  console.error(erro);
  process.exitCode = 1;
});
