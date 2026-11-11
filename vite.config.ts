import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

/**
 * O Vite só expõe ao navegador variáveis com o prefixo `VITE_`.
 * A integração Supabase da Vercel, porém, costuma criar `SUPABASE_URL` e
 * `SUPABASE_ANON_KEY` sem prefixo. Injetamos explicitamente apenas esses dois
 * valores públicos no bundle — nunca `SUPABASE_SERVICE_ROLE_KEY` ou qualquer
 * outro segredo que exista no ambiente.
 */
function validarChavePublica(chave: string): string {
  if (!chave) return '';
  if (chave.startsWith('sb_secret_')) {
    throw new Error(
      'A variável configurada parece ser uma chave secreta (sb_secret_). Use a chave anon/publishable; nunca exponha a service_role no front-end.',
    );
  }
  const partes = chave.split('.');
  if (partes.length === 3) {
    let papel = '';
    try {
      const payload = JSON.parse(
        Buffer.from(partes[1], 'base64url').toString('utf8'),
      ) as { role?: string };
      papel = payload.role ?? '';
    } catch {
      // Chave malformada: o Supabase dará a mensagem definitiva no login.
    }
    if (papel === 'service_role') {
      throw new Error(
        'A variável configurada contém a service_role. Use a chave anon/publishable; a service_role nunca pode ir para o navegador.',
      );
    }
  }
  return chave;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || '';
  const supabaseKey = validarChavePublica(
    env.VITE_SUPABASE_ANON_KEY ||
      env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      env.SUPABASE_ANON_KEY ||
      env.SUPABASE_PUBLISHABLE_KEY ||
      '',
  );

  return {
    define: {
      __SUPABASE_URL__: JSON.stringify(supabaseUrl.trim()),
      __SUPABASE_ANON_KEY__: JSON.stringify(supabaseKey.trim()),
    },
    plugins: [react(), tailwindcss()],
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    preview: {
      port: 4173,
      host: '0.0.0.0',
    },
  };
});
