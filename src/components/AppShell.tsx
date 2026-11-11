import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  BookOpen,
  ChevronDown,
  ClipboardCheck,
  Database,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  RefreshCw,
  RotateCcw,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { Brand } from './Brand';
import { useApp } from '../context/AppContext';
import { EVENTO } from '../data/event';
import { classNames, iniciais } from '../lib/format';

export type Aba = 'avaliar' | 'painel' | 'curadoria' | 'regulamento';

interface AppShellProps {
  aba: Aba;
  onAba: (aba: Aba) => void;
  children: ReactNode;
}

const abas = [
  { id: 'avaliar' as const, rotulo: 'Avaliar', icone: ClipboardCheck, presidente: false },
  { id: 'painel' as const, rotulo: 'Painel', icone: LayoutDashboard, presidente: true },
  { id: 'curadoria' as const, rotulo: 'Curadoria', icone: LibraryBig, presidente: true },
  { id: 'regulamento' as const, rotulo: 'Regulamento', icone: BookOpen, presidente: false },
];

export function AppShell({ aba, onAba, children }: AppShellProps) {
  const { membro, modo, aviso, sair, recarregar, resetarDemo, carregando } = useApp();

  if (!membro) return null;

  const disponiveis = abas.filter((item) => !item.presidente || membro.papel === 'presidente');

  const reiniciar = async () => {
    const confirmado = window.confirm(
      'Reiniciar a demonstração? Todas as avaliações e alterações feitas neste navegador serão apagadas.',
    );
    if (confirmado) await resetarDemo();
  };

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-950 text-white shadow-[0_10px_30px_-20px_rgba(5,43,44,0.8)]">
        <div className="h-[3px] bg-gradient-to-r from-accent-500 via-accent-400 to-brand-400" />
        <div className="mx-auto flex h-[68px] max-w-[1520px] items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => onAba(membro.papel === 'presidente' ? 'painel' : 'avaliar')}
            className="shrink-0 text-left"
            aria-label="Ir para o início"
          >
            <Brand tom="claro" compacto />
          </button>

          <nav className="ml-4 hidden h-full items-stretch gap-1 md:flex" aria-label="Navegação principal">
            {disponiveis.map((item) => {
              const Icone = item.icone;
              const ativo = aba === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onAba(item.id)}
                  className={classNames(
                    'relative flex items-center gap-2 px-3 text-[12.5px] font-semibold transition',
                    ativo ? 'text-white' : 'text-brand-200 hover:text-white',
                  )}
                >
                  <Icone className={classNames('h-4 w-4', ativo ? 'text-accent-400' : 'text-brand-300')} />
                  {item.rotulo}
                  {ativo && (
                    <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-accent-400" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span
              className={classNames(
                'hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] sm:inline-flex',
                modo === 'demo'
                  ? 'border-accent-400/25 bg-accent-400/10 text-accent-300'
                  : 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
              )}
              title={modo === 'demo' ? 'Dados salvos neste navegador' : 'Dados persistidos no Supabase'}
            >
              {modo === 'demo' ? <Sparkles className="h-3 w-3" /> : <Database className="h-3 w-3" />}
              {modo === 'demo' ? 'Demonstração' : 'Supabase'}
            </span>
            <MenuUsuario
              iniciais={iniciais(membro.nome)}
              nome={membro.nome}
              papel={membro.papel}
              modo={modo}
              carregando={carregando}
              onSair={() => void sair()}
              onRecarregar={() => void recarregar()}
              onReiniciar={() => void reiniciar()}
            />
          </div>
        </div>

        <nav className="scrollbar-thin flex gap-0.5 overflow-x-auto border-t border-white/10 px-2 md:hidden" aria-label="Navegação principal">
          {disponiveis.map((item) => {
            const Icone = item.icone;
            const ativo = aba === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onAba(item.id)}
                className={classNames(
                  'relative flex shrink-0 items-center gap-1.5 px-2 py-2.5 text-[11.5px] font-semibold transition',
                  ativo ? 'text-white' : 'text-brand-200',
                )}
              >
                <Icone className={classNames('h-3.5 w-3.5', ativo ? 'text-accent-400' : 'text-brand-300')} />
                {item.rotulo}
                {ativo && <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-accent-400" />}
              </button>
            );
          })}
        </nav>
      </header>

      {modo === 'demo' && (
        <div className="border-b border-accent-200/70 bg-accent-50/80">
          <div className="mx-auto flex max-w-[1520px] flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2 text-[11px] text-accent-700 sm:px-6">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span className="font-semibold">Você está na demonstração.</span>
            <span className="text-accent-700/80">Os dados ficam apenas neste navegador.</span>
            <button
              type="button"
              onClick={() => void reiniciar()}
              className="ml-auto inline-flex items-center gap-1 font-semibold underline decoration-accent-300 underline-offset-2 hover:text-accent-600"
            >
              <RotateCcw className="h-3 w-3" /> Reiniciar dados
            </button>
          </div>
        </div>
      )}

      {aviso && (
        <div className="border-b border-rose-500/20 bg-rose-100/60">
          <div className="mx-auto flex max-w-[1520px] items-start gap-2 px-4 py-2.5 text-[12px] leading-relaxed text-rose-600 sm:px-6">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{aviso}</span>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1520px] flex-1 px-3 py-5 sm:px-6 sm:py-7 lg:py-8">
        {children}
      </main>

      <footer className="border-t border-line-soft bg-paper-deep/40">
        <div className="mx-auto flex max-w-[1520px] flex-col gap-3 px-4 py-5 text-[10.5px] text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-bold uppercase tracking-[0.14em] text-ink-soft">Bancas DCBV</span>
            <span className="hidden h-3 w-px bg-line sm:block" />
            <span>{EVENTO.nome} · {EVENTO.dataCurta}</span>
            <span className="hidden h-3 w-px bg-line sm:block" />
            <span>UFJF · Campus Governador Valadares</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <a
              href={EVENTO.links.regulamento}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-brand-700 underline decoration-brand-200 underline-offset-2 hover:text-brand-900"
            >
              Regulamento oficial
            </a>
            <span>v1.0 · instrumento pedagógico</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface MenuUsuarioProps {
  iniciais: string;
  nome: string;
  papel: string;
  modo: 'demo' | 'supabase';
  carregando: boolean;
  onSair: () => void;
  onRecarregar: () => void;
  onReiniciar: () => void;
}

function MenuUsuario({
  iniciais,
  nome,
  papel,
  modo,
  carregando,
  onSair,
  onRecarregar,
  onReiniciar,
}: MenuUsuarioProps) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const aoClicar = (evento: MouseEvent) => {
      if (ref.current && !ref.current.contains(evento.target as Node)) setAberto(false);
    };
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAberto(false);
    };
    document.addEventListener('mousedown', aoClicar);
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('mousedown', aoClicar);
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-2.5 text-left transition hover:bg-white/[0.09]"
        aria-haspopup="menu"
        aria-expanded={aberto}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-400 text-[11px] font-extrabold text-brand-950">
          {iniciais}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-[140px] truncate text-[11.5px] font-semibold leading-tight text-white">
            {nome}
          </span>
          <span className="block text-[9.5px] font-medium uppercase tracking-[0.1em] text-brand-300">
            {papel === 'presidente' ? 'Presidência' : 'Avaliação'}
          </span>
        </span>
        <ChevronDown className={classNames('h-3.5 w-3.5 text-brand-300 transition', aberto && 'rotate-180')} />
      </button>

      {aberto && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-white shadow-float animate-rise"
        >
          <div className="border-b border-line-soft px-4 py-3">
            <p className="truncate text-[12.5px] font-semibold text-ink">{nome}</p>
            <p className="mt-0.5 text-[10.5px] text-ink-muted">
              {papel === 'presidente' ? 'Presidência da comissão' : 'Avaliador(a) convidado(a)'} ·{' '}
              {modo === 'demo' ? 'demonstração' : 'Supabase'}
            </p>
          </div>
          <div className="p-1.5">
            <button
              type="button"
              onClick={() => {
                setAberto(false);
                onRecarregar();
              }}
              disabled={carregando}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[12px] font-medium text-ink-soft transition hover:bg-paper disabled:opacity-50"
              role="menuitem"
            >
              <RefreshCw className={classNames('h-3.5 w-3.5 text-ink-muted', carregando && 'animate-spin')} />
              Recarregar dados
            </button>
            {modo === 'demo' && (
              <button
                type="button"
                onClick={() => {
                  setAberto(false);
                  onReiniciar();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[12px] font-medium text-ink-soft transition hover:bg-paper"
                role="menuitem"
              >
                <RotateCcw className="h-3.5 w-3.5 text-ink-muted" />
                Reiniciar demonstração
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setAberto(false);
                onSair();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[12px] font-medium text-rose-600 transition hover:bg-rose-100/60"
              role="menuitem"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
