import { createClient } from '@supabase/supabase-js';

/**
 * Chave publicável (publishable key): pode ser exposta no front-end.
 * O acesso real é controlado pelas políticas de RLS do Supabase.
 *
 * Sem VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY o app abre em modo
 * demonstração. Em produção, defina as duas no ambiente de deploy; nunca
 * coloque a service_role no front-end.
 */
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const chave =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim() ||
  '';

export const SUPABASE_CONFIGURADO = Boolean(url && chave);

export const supabase = SUPABASE_CONFIGURADO
  ? createClient(url, chave, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function mensagemDeErro(erro: unknown): string {
  if (!erro) return 'Erro desconhecido.';
  if (typeof erro === 'string') return traduzirMensagem(erro);
  if (erro instanceof Error) return traduzirMensagem(erro.message);
  if (typeof erro === 'object' && 'message' in erro) {
    return traduzirMensagem(String((erro as { message: unknown }).message));
  }
  return 'Não foi possível concluir a operação.';
}

function traduzirMensagem(mensagem: string): string {
  const m = mensagem.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (m.includes('failed to fetch') || m.includes('networkerror')) {
    return 'Não foi possível conectar ao Supabase. Verifique a rede e as variáveis de ambiente.';
  }
  if (m.includes('could not find the table') || m.includes('pgrst205')) {
    return 'O banco está conectado, mas o schema ainda não foi aplicado. Rode o arquivo supabase/migrations/0001_init.sql no SQL Editor.';
  }
  if (m.includes('invalid api key') || m.includes('jwt')) {
    return 'A chave pública do Supabase não foi aceita. Confira VITE_SUPABASE_ANON_KEY.';
  }
  if (m.includes('row-level security') || m.includes('permission denied')) {
    return 'A política de acesso ao banco bloqueou esta operação. Confira o vínculo do seu usuário na tabela avaliadores.';
  }
  if (m.includes('duplicate key')) return 'Já existe um registro com este identificador.';
  return mensagem;
}
