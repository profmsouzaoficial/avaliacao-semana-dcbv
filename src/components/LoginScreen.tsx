import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  ExternalLink,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { Brand } from './Brand';
import { Button } from './Button';
import { Badge } from './Badge';
import { useApp } from '../context/AppContext';
import { EVENTO } from '../data/event';
import { MEMBROS_DEMO } from '../data/demo';
import { classNames, iniciais } from '../lib/format';
import { mensagemDeErro } from '../lib/supabase';

export function LoginScreen() {
  const { modo, aviso, carregando, entrar, entrarDemo, membros } = useApp();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarDemo, setMostrarDemo] = useState(modo === 'demo');

  const perfis = useMemo(
    () => (membros.length > 0 ? membros.filter((m) => m.ativo) : MEMBROS_DEMO),
    [membros],
  );

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErro(null);
    try {
      await entrar(email, senha);
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

  const abrirDemo = async (id: string) => {
    setErro(null);
    try {
      await entrarDemo(id);
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  };

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[1.06fr_0.94fr]">
      <section className="hero-mesh relative isolate overflow-hidden px-6 py-8 text-white sm:px-10 lg:min-h-screen lg:px-12 xl:px-16">
        <div className="hero-grid absolute inset-0 -z-10" />
        <div className="absolute -right-24 top-28 -z-10 h-72 w-72 rounded-full border border-white/10" />
        <div className="absolute -right-10 top-40 -z-10 h-48 w-48 rounded-full border border-accent-400/20" />
        <div className="relative flex min-h-[calc(100vh-4rem)] flex-col">
          <div className="flex items-center justify-between gap-4">
            <Brand tom="claro" />
            <a
              href={EVENTO.links.site}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 text-[11px] font-semibold text-brand-200 transition hover:text-white sm:inline-flex"
            >
              Site do evento <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="my-auto max-w-2xl py-14 lg:py-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-100 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
              Avaliação de pôsteres · 2026
            </div>
            <h1 className="display mt-6 text-[clamp(2.8rem,5.2vw,5rem)] font-semibold leading-[0.94] text-white">
              A ciência básica
              <br />
              encontra a
              <br />
              <span className="italic text-accent-400">formação.</span>
            </h1>
            <p className="mt-7 max-w-lg text-[15px] leading-relaxed text-brand-100/90">
              Um instrumento para avaliar banners com olhar formativo: claro para quem avalia,
              justo para quem está começando a apresentar ciência.
            </p>
            <div className="mt-8 flex flex-wrap gap-2.5">
              <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[11.5px] font-medium text-brand-50">
                {EVENTO.datas}
              </span>
              <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[11.5px] font-medium text-brand-50">
                Governador Valadares
              </span>
              <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[11.5px] font-medium text-brand-50">
                102 trabalhos · 7 sessões
              </span>
            </div>
          </div>

          <div className="grid gap-4 border-t border-white/15 pt-5 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="max-w-md text-[11.5px] leading-relaxed text-brand-200">
                {EVENTO.instituicao} · {EVENTO.departamento}
              </p>
              <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-300/70">
                Instrumento pedagógico de apoio à Comissão Científica
              </p>
            </div>
            <div className="hidden text-right sm:block">
              <div className="display text-3xl font-semibold text-accent-400">DCBV</div>
              <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-300">
                desde 2026
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8 lg:px-10">
        <div className="w-full max-w-[440px]">
          <div className="mb-7 flex items-center justify-between lg:hidden">
            <Brand />
            <a
              href={EVENTO.links.site}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-semibold text-brand-700"
            >
              Site
            </a>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-line-soft bg-white px-6 pb-5 pt-6 sm:px-8">
              <div className="eyebrow">{modo === 'demo' || mostrarDemo ? 'Demonstração' : 'Acesso da comissão'}</div>
              <h2 className="display mt-2 text-[28px] font-semibold leading-tight text-ink">
                {modo === 'demo' || mostrarDemo ? 'Escolha um perfil' : 'Entrar no painel'}
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                {modo === 'demo' || mostrarDemo
                  ? 'Explore o fluxo completo com os títulos reais dos trabalhos aprovados. Nada é enviado para o Supabase.'
                  : 'Use o e-mail cadastrado pela presidência da comissão. A senha é gerenciada pelo Supabase Auth.'}
              </p>
            </div>

            <div className="px-6 py-6 sm:px-8">
              {(aviso || erro) && modo !== 'demo' && !mostrarDemo && (
                <div className="mb-5 rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3 text-[12px] leading-relaxed text-accent-700">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-semibold">{erro || aviso}</p>
                      {(erro || aviso || '').includes('schema') && (
                        <details className="mt-2">
                          <summary className="cursor-pointer font-semibold underline decoration-accent-400 underline-offset-2">
                            Como aplicar o schema
                          </summary>
                          <ol className="mt-2 list-decimal space-y-1 pl-4">
                            <li>Abra o projeto no Supabase → SQL Editor.</li>
                            <li>Cole o conteúdo de <code>supabase/migrations/0001_init.sql</code>.</li>
                            <li>Execute e recarregue esta página.</li>
                            <li>Cadastre seu e-mail na tabela <code>avaliadores</code> e crie o usuário em Authentication → Users.</li>
                          </ol>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {modo === 'demo' || mostrarDemo ? (
                <div className="space-y-2.5">
                  {perfis.map((perfil) => (
                    <button
                      key={perfil.id}
                      type="button"
                      disabled={carregando}
                      onClick={() => void abrirDemo(perfil.id)}
                      className="group flex w-full items-center gap-3 rounded-2xl border border-line bg-white px-3.5 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50/60 disabled:opacity-60"
                    >
                      <span
                        className={classNames(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold',
                          perfil.papel === 'presidente'
                            ? 'bg-brand-800 text-white'
                            : 'bg-brand-50 text-brand-700',
                        )}
                      >
                        {iniciais(perfil.nome)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[13.5px] font-semibold text-ink">{perfil.nome}</span>
                          <Badge tom={perfil.papel === 'presidente' ? 'brand' : 'neutral'} className="shrink-0">
                            {perfil.papel === 'presidente' ? 'Presidência' : 'Avaliador'}
                          </Badge>
                        </span>
                        <span className="mt-0.5 block truncate text-[11.5px] text-ink-muted">
                          {perfil.papel === 'presidente'
                            ? 'Vê tudo, distribui e gera a ata.'
                            : 'Avalia os banners atribuídos a você.'}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-brand-700" />
                    </button>
                  ))}
                  <p className="pt-1 text-center text-[10.5px] leading-relaxed text-ink-muted">
                    A demonstração usa o armazenamento local deste navegador. Você pode reiniciar os
                    dados a qualquer momento no menu do perfil.
                  </p>
                  {modo !== 'demo' && (
                    <button
                      type="button"
                      onClick={() => setMostrarDemo(false)}
                      className="mt-2 w-full text-center text-[11.5px] font-semibold text-brand-700 underline decoration-brand-200 underline-offset-4 hover:text-brand-800"
                    >
                      Voltar para o acesso da comissão
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={enviar} className="space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-semibold text-ink-soft">E-mail institucional</span>
                    <span className="relative block">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu.nome@ufjf.br"
                        className="h-11 w-full rounded-xl border border-line bg-paper-light pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
                      />
                    </span>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Senha</span>
                    <span className="relative block">
                      <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                      <input
                        type={mostrarSenha ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="••••••••"
                        className="h-11 w-full rounded-xl border border-line bg-paper-light pl-10 pr-11 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenha((v) => !v)}
                        className="absolute right-2.5 top-1/2 rounded-lg p-1.5 text-ink-muted transition hover:bg-paper-deep hover:text-ink"
                        aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </span>
                  </label>
                  <Button type="submit" tamanho="lg" carregando={carregando} className="w-full">
                    Entrar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              )}

              {modo !== 'demo' && !mostrarDemo && (
                <>
                  <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-line-soft" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">ou</span>
                    <div className="h-px flex-1 bg-line-soft" />
                  </div>
                  <Button
                    variante="secondary"
                    tamanho="lg"
                    onClick={() => {
                      setErro(null);
                      setMostrarDemo(true);
                    }}
                    className="w-full"
                    icone={<Sparkles className="h-4 w-4 text-accent-500" />}
                  >
                    Explorar demonstração
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-500" />
              Dados protegidos por RLS
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="h-3.5 w-3.5 text-brand-500" />
              Avaliação individual
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-brand-500" />
              Regulamento 2026
            </span>
          </div>
          <p className="mx-auto mt-4 max-w-sm text-center text-[10.5px] leading-relaxed text-ink-muted">
            {EVENTO.nome} · {EVENTO.subtitulo}. Instrumento pedagógico de apoio; não substitui o
            barema oficial da Comissão Científica.
          </p>
        </div>
      </section>
    </div>
  );
}
