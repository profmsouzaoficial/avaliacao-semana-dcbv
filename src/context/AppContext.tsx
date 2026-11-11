import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  Atribuicao,
  Avaliacao,
  Membro,
  Trabalho,
} from '../types';
import {
  criarRepositorio,
  type ModoDados,
  type Repositorio,
  type Snapshot,
} from '../lib/repository';
import { SUPABASE_CONFIGURADO } from '../lib/supabase';
import { mensagemDeErro } from '../lib/supabase';

type TipoToast = 'sucesso' | 'erro' | 'info';

interface Toast {
  id: number;
  mensagem: string;
  tipo: TipoToast;
}

interface AppContextValue {
  pronto: boolean;
  modo: ModoDados;
  schemaOk: boolean;
  aviso: string | null;
  membro: Membro | null;
  membros: Membro[];
  trabalhos: Trabalho[];
  atribuicoes: Atribuicao[];
  avaliacoes: Avaliacao[];
  carregando: boolean;
  toast: Toast | null;
  entrar: (email: string, senha: string) => Promise<void>;
  entrarDemo: (membroId: string) => Promise<void>;
  sair: () => Promise<void>;
  recarregar: () => Promise<void>;
  salvarAvaliacao: (avaliacao: Avaliacao) => Promise<Avaliacao>;
  salvarTrabalho: (trabalho: Trabalho) => Promise<Trabalho>;
  excluirTrabalho: (id: string) => Promise<void>;
  importarTrabalhos: (trabalhos: Trabalho[]) => Promise<void>;
  atribuir: (avaliadorId: string, trabalhoIds: string[]) => Promise<void>;
  desatribuir: (avaliadorId: string, trabalhoId: string) => Promise<void>;
  salvarMembro: (membro: Membro) => Promise<Membro>;
  excluirMembro: (id: string) => Promise<void>;
  resetarDemo: () => Promise<void>;
  notificar: (mensagem: string, tipo?: TipoToast) => void;
  fecharToast: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const VAZIO: Snapshot = {
  membros: [],
  trabalhos: [],
  atribuicoes: [],
  avaliacoes: [],
};

function upsertPorId<T extends { id: string }>(lista: T[], item: T): T[] {
  const indice = lista.findIndex((atual) => atual.id === item.id);
  if (indice < 0) return [...lista, item];
  const copia = [...lista];
  copia[indice] = item;
  return copia;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [pronto, setPronto] = useState(false);
  const [modo, setModo] = useState<ModoDados>(SUPABASE_CONFIGURADO ? 'supabase' : 'demo');
  const [schemaOk, setSchemaOk] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);
  const [membro, setMembro] = useState<Membro | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot>(VAZIO);
  const [carregando, setCarregando] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const repoRef = useRef<Repositorio | null>(null);
  const iniciadoRef = useRef(false);

  const notificar = useCallback((mensagem: string, tipo: TipoToast = 'info') => {
    setToast({ id: Date.now() + Math.random(), mensagem, tipo });
  }, []);

  const fecharToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const aplicar = useCallback((resultado: {
    membro: Membro | null;
    snapshot: Snapshot;
    schemaOk: boolean;
    aviso?: string;
  }) => {
    setMembro(resultado.membro);
    setSnapshot(resultado.snapshot);
    setSchemaOk(resultado.schemaOk);
    setAviso(resultado.aviso ?? null);
  }, []);

  const iniciar = useCallback(
    async (novoModo: ModoDados, autoDemoId?: string) => {
      setCarregando(true);
      setAviso(null);
      try {
        const repo = criarRepositorio(novoModo);
        repoRef.current = repo;
        setModo(novoModo);
        let resultado = await repo.inicializar();
        if (novoModo === 'demo' && autoDemoId) {
          try {
            await repo.entrarDemo(autoDemoId);
            resultado = await repo.recarregar();
          } catch (erro) {
            setAviso(mensagemDeErro(erro));
          }
        }
        aplicar(resultado);
      } catch (erro) {
        setAviso(mensagemDeErro(erro));
        setSnapshot(VAZIO);
        setMembro(null);
      } finally {
        setPronto(true);
        setCarregando(false);
      }
    },
    [aplicar],
  );

  useEffect(() => {
    if (iniciadoRef.current) return;
    iniciadoRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const demo = params.get('demo');
    if (demo !== null) {
      const auto = demo === '1' || demo === '' ? undefined : demo;
      void iniciar('demo', auto);
    } else {
      void iniciar(SUPABASE_CONFIGURADO ? 'supabase' : 'demo');
    }
  }, [iniciar]);

  const entrar = useCallback(
    async (email: string, senha: string) => {
      const repo = repoRef.current;
      if (!repo) throw new Error('Aplicativo ainda não iniciou.');
      setCarregando(true);
      try {
        const autenticado = await repo.entrar(email, senha);
        const resultado = await repo.recarregar();
        setMembro(autenticado);
        setSnapshot(resultado.snapshot);
        setSchemaOk(resultado.schemaOk);
        setAviso(resultado.aviso ?? null);
        notificar(`Bem-vindo(a), ${autenticado.nome.split(' ')[0]}.`, 'sucesso');
      } finally {
        setCarregando(false);
      }
    },
    [notificar],
  );

  const entrarDemo = useCallback(
    async (membroId: string) => {
      setCarregando(true);
      try {
        if (modo !== 'demo' || !repoRef.current) {
          const repo = criarRepositorio('demo');
          repoRef.current = repo;
          setModo('demo');
          await repo.inicializar();
        }
        const repo = repoRef.current;
        if (!repo) throw new Error('Não foi possível abrir a demonstração.');
        const autenticado = await repo.entrarDemo(membroId);
        const resultado = await repo.recarregar();
        setMembro(autenticado);
        setSnapshot(resultado.snapshot);
        setSchemaOk(true);
        setAviso(null);
        notificar(`Demonstração aberta como ${autenticado.nome}.`, 'info');
      } finally {
        setCarregando(false);
      }
    },
    [modo, notificar],
  );

  const sair = useCallback(async () => {
    const repo = repoRef.current;
    setCarregando(true);
    try {
      if (repo) await repo.sair();
      setMembro(null);
      setSnapshot(VAZIO);
      setAviso(null);
      notificar('Sessão encerrada.', 'info');
    } finally {
      setCarregando(false);
    }
  }, [notificar]);

  const recarregar = useCallback(async () => {
    const repo = repoRef.current;
    if (!repo) return;
    setCarregando(true);
    try {
      const resultado = await repo.recarregar();
      aplicar(resultado);
    } finally {
      setCarregando(false);
    }
  }, [aplicar]);

  const salvarAvaliacao = useCallback(
    async (avaliacao: Avaliacao) => {
      const repo = repoRef.current;
      if (!repo) throw new Error('Aplicativo ainda não iniciou.');
      const salva = await repo.salvarAvaliacao(avaliacao);
      setSnapshot((atual) => ({
        ...atual,
        avaliacoes: upsertPorId(atual.avaliacoes, salva),
      }));
      return salva;
    },
    [],
  );

  const salvarTrabalho = useCallback(async (trabalho: Trabalho) => {
    const repo = repoRef.current;
    if (!repo) throw new Error('Aplicativo ainda não iniciou.');
    const salvo = await repo.salvarTrabalho(trabalho);
    setSnapshot((atual) => ({
      ...atual,
      trabalhos: upsertPorId(atual.trabalhos, salvo).sort((a, b) =>
        a.codigo.localeCompare(b.codigo),
      ),
    }));
    return salvo;
  }, []);

  const excluirTrabalho = useCallback(async (id: string) => {
    const repo = repoRef.current;
    if (!repo) throw new Error('Aplicativo ainda não iniciou.');
    await repo.excluirTrabalho(id);
    setSnapshot((atual) => ({
      ...atual,
      trabalhos: atual.trabalhos.filter((t) => t.id !== id),
      atribuicoes: atual.atribuicoes.filter((a) => a.trabalhoId !== id),
      avaliacoes: atual.avaliacoes.filter((a) => a.trabalhoId !== id),
    }));
  }, []);

  const importarTrabalhos = useCallback(async (trabalhos: Trabalho[]) => {
    const repo = repoRef.current;
    if (!repo) throw new Error('Aplicativo ainda não iniciou.');
    const salvos = await repo.importarTrabalhos(trabalhos);
    setSnapshot((atual) => {
      const mapa = new Map(atual.trabalhos.map((t) => [t.id, t]));
      salvos.forEach((t) => mapa.set(t.id, t));
      return {
        ...atual,
        trabalhos: [...mapa.values()].sort((a, b) => a.codigo.localeCompare(b.codigo)),
      };
    });
  }, []);

  const atribuir = useCallback(async (avaliadorId: string, trabalhoIds: string[]) => {
    const repo = repoRef.current;
    if (!repo) throw new Error('Aplicativo ainda não iniciou.');
    const novas = await repo.atribuir(avaliadorId, trabalhoIds);
    setSnapshot((atual) => {
      const mapa = new Map(atual.atribuicoes.map((a) => [a.id, a]));
      novas.forEach((a) => mapa.set(a.id, a));
      return { ...atual, atribuicoes: [...mapa.values()] };
    });
  }, []);

  const desatribuir = useCallback(async (avaliadorId: string, trabalhoId: string) => {
    const repo = repoRef.current;
    if (!repo) throw new Error('Aplicativo ainda não iniciou.');
    await repo.desatribuir(avaliadorId, trabalhoId);
    setSnapshot((atual) => ({
      ...atual,
      atribuicoes: atual.atribuicoes.filter(
        (a) => !(a.avaliadorId === avaliadorId && a.trabalhoId === trabalhoId),
      ),
      avaliacoes: atual.avaliacoes.filter(
        (a) => !(a.avaliadorId === avaliadorId && a.trabalhoId === trabalhoId),
      ),
    }));
  }, []);

  const salvarMembro = useCallback(async (novo: Membro) => {
    const repo = repoRef.current;
    if (!repo) throw new Error('Aplicativo ainda não iniciou.');
    const salvo = await repo.salvarMembro(novo);
    setSnapshot((atual) => ({
      ...atual,
      membros: upsertPorId(atual.membros, salvo).sort(
        (a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome),
      ),
    }));
    setMembro((atual) => (atual && atual.id === salvo.id ? salvo : atual));
    return salvo;
  }, []);

  const excluirMembro = useCallback(
    async (id: string) => {
      const repo = repoRef.current;
      if (!repo) throw new Error('Aplicativo ainda não iniciou.');
      await repo.excluirMembro(id);
      setSnapshot((atual) => ({
        ...atual,
        membros: atual.membros.filter((m) => m.id !== id),
        atribuicoes: atual.atribuicoes.filter((a) => a.avaliadorId !== id),
        avaliacoes: atual.avaliacoes.filter((a) => a.avaliadorId !== id),
      }));
      if (membro?.id === id) {
        setMembro(null);
        await repo.sair();
      }
    },
    [membro],
  );

  const resetarDemo = useCallback(async () => {
    const repo = repoRef.current;
    if (!repo) return;
    await repo.resetarDemo();
    const resultado = await repo.recarregar();
    aplicar(resultado);
    notificar('Demonstração reiniciada com os dados originais.', 'info');
  }, [aplicar, notificar]);

  const valor = useMemo<AppContextValue>(
    () => ({
      pronto,
      modo,
      schemaOk,
      aviso,
      membro,
      membros: snapshot.membros,
      trabalhos: snapshot.trabalhos,
      atribuicoes: snapshot.atribuicoes,
      avaliacoes: snapshot.avaliacoes,
      carregando,
      toast,
      entrar,
      entrarDemo,
      sair,
      recarregar,
      salvarAvaliacao,
      salvarTrabalho,
      excluirTrabalho,
      importarTrabalhos,
      atribuir,
      desatribuir,
      salvarMembro,
      excluirMembro,
      resetarDemo,
      notificar,
      fecharToast,
    }),
    [
      pronto,
      modo,
      schemaOk,
      aviso,
      membro,
      snapshot,
      carregando,
      toast,
      entrar,
      entrarDemo,
      sair,
      recarregar,
      salvarAvaliacao,
      salvarTrabalho,
      excluirTrabalho,
      importarTrabalhos,
      atribuir,
      desatribuir,
      salvarMembro,
      excluirMembro,
      resetarDemo,
      notificar,
      fecharToast,
    ],
  );

  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const contexto = useContext(AppContext);
  if (!contexto) throw new Error('useApp deve ser usado dentro de AppProvider.');
  return contexto;
}
