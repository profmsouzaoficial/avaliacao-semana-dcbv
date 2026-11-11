import type {
  Atribuicao,
  Avaliacao,
  Membro,
  Papel,
  Trabalho,
} from '../types';
import { ATRIBUICOES_DEMO, MEMBROS_DEMO, TRABALHOS_DEMO } from '../data/demo';
import { mensagemDeErro, supabase } from './supabase';
import { uid } from './format';

export type ModoDados = 'demo' | 'supabase';

export interface Snapshot {
  membros: Membro[];
  trabalhos: Trabalho[];
  atribuicoes: Atribuicao[];
  avaliacoes: Avaliacao[];
}

export interface ResultadoInicializacao {
  membro: Membro | null;
  snapshot: Snapshot;
  schemaOk: boolean;
  aviso?: string;
}

export interface Repositorio {
  modo: ModoDados;
  inicializar(): Promise<ResultadoInicializacao>;
  entrar(email: string, senha: string): Promise<Membro>;
  entrarDemo(membroId: string): Promise<Membro>;
  sair(): Promise<void>;
  recarregar(): Promise<ResultadoInicializacao>;
  salvarAvaliacao(avaliacao: Avaliacao): Promise<Avaliacao>;
  salvarTrabalho(trabalho: Trabalho): Promise<Trabalho>;
  excluirTrabalho(id: string): Promise<void>;
  importarTrabalhos(trabalhos: Trabalho[]): Promise<Trabalho[]>;
  atribuir(avaliadorId: string, trabalhoIds: string[]): Promise<Atribuicao[]>;
  desatribuir(avaliadorId: string, trabalhoId: string): Promise<void>;
  salvarMembro(membro: Membro): Promise<Membro>;
  excluirMembro(id: string): Promise<void>;
  resetarDemo(): Promise<void>;
}

const PREFIXO = 'dcbv2026:v1:';
const CHAVES = {
  membros: `${PREFIXO}membros`,
  trabalhos: `${PREFIXO}trabalhos`,
  atribuicoes: `${PREFIXO}atribuicoes`,
  avaliacoes: `${PREFIXO}avaliacoes`,
  sessao: `${PREFIXO}sessao`,
  inicializado: `${PREFIXO}inicializado`,
};

function clone<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T;
}

function lerJson<T>(chave: string, fallback: T): T {
  try {
    const bruto = localStorage.getItem(chave);
    if (!bruto) return fallback;
    return JSON.parse(bruto) as T;
  } catch {
    return fallback;
  }
}

function gravarJson(chave: string, valor: unknown): void {
  localStorage.setItem(chave, JSON.stringify(valor));
}

function seedDemo(): Snapshot {
  const snapshot: Snapshot = {
    membros: clone(MEMBROS_DEMO),
    trabalhos: clone(TRABALHOS_DEMO),
    atribuicoes: clone(ATRIBUICOES_DEMO),
    avaliacoes: [],
  };
  gravarJson(CHAVES.membros, snapshot.membros);
  gravarJson(CHAVES.trabalhos, snapshot.trabalhos);
  gravarJson(CHAVES.atribuicoes, snapshot.atribuicoes);
  gravarJson(CHAVES.avaliacoes, snapshot.avaliacoes);
  localStorage.setItem(CHAVES.inicializado, '1');
  return snapshot;
}

function carregarDemo(): Snapshot {
  if (localStorage.getItem(CHAVES.inicializado) !== '1') {
    return seedDemo();
  }
  return {
    membros: lerJson(CHAVES.membros, clone(MEMBROS_DEMO)),
    trabalhos: lerJson(CHAVES.trabalhos, clone(TRABALHOS_DEMO)),
    atribuicoes: lerJson(CHAVES.atribuicoes, clone(ATRIBUICOES_DEMO)),
    avaliacoes: lerJson(CHAVES.avaliacoes, [] as Avaliacao[]),
  };
}

function persistirDemo(snapshot: Snapshot): void {
  gravarJson(CHAVES.membros, snapshot.membros);
  gravarJson(CHAVES.trabalhos, snapshot.trabalhos);
  gravarJson(CHAVES.atribuicoes, snapshot.atribuicoes);
  gravarJson(CHAVES.avaliacoes, snapshot.avaliacoes);
}

export class DemoRepository implements Repositorio {
  modo: ModoDados = 'demo';
  private snapshot: Snapshot = {
    membros: [],
    trabalhos: [],
    atribuicoes: [],
    avaliacoes: [],
  };

  async inicializar(): Promise<ResultadoInicializacao> {
    this.snapshot = carregarDemo();
    const sessaoId = localStorage.getItem(CHAVES.sessao);
    const membro = sessaoId
      ? this.snapshot.membros.find((m) => m.id === sessaoId && m.ativo) ?? null
      : null;
    return { membro, snapshot: this.snapshot, schemaOk: true };
  }

  async entrarDemo(membroId: string): Promise<Membro> {
    this.snapshot = carregarDemo();
    const membro = this.snapshot.membros.find((m) => m.id === membroId && m.ativo);
    if (!membro) throw new Error('Perfil de demonstração não encontrado.');
    localStorage.setItem(CHAVES.sessao, membro.id);
    return membro;
  }

  async entrar(): Promise<Membro> {
    throw new Error('O modo demonstração não usa e-mail e senha. Escolha um perfil.');
  }

  async sair(): Promise<void> {
    localStorage.removeItem(CHAVES.sessao);
  }

  async recarregar(): Promise<ResultadoInicializacao> {
    return this.inicializar();
  }

  async salvarAvaliacao(avaliacao: Avaliacao): Promise<Avaliacao> {
    const agora = new Date().toISOString();
    const registro: Avaliacao = { ...avaliacao, atualizadoEm: agora };
    const indice = this.snapshot.avaliacoes.findIndex((a) => a.id === registro.id);
    if (indice >= 0) this.snapshot.avaliacoes[indice] = registro;
    else this.snapshot.avaliacoes.push(registro);
    persistirDemo(this.snapshot);
    return registro;
  }

  async salvarTrabalho(trabalho: Trabalho): Promise<Trabalho> {
    const indice = this.snapshot.trabalhos.findIndex((t) => t.id === trabalho.id);
    if (indice >= 0) this.snapshot.trabalhos[indice] = trabalho;
    else this.snapshot.trabalhos.push(trabalho);
    this.snapshot.trabalhos.sort((a, b) => a.codigo.localeCompare(b.codigo));
    persistirDemo(this.snapshot);
    return trabalho;
  }

  async excluirTrabalho(id: string): Promise<void> {
    this.snapshot.trabalhos = this.snapshot.trabalhos.filter((t) => t.id !== id);
    this.snapshot.atribuicoes = this.snapshot.atribuicoes.filter((a) => a.trabalhoId !== id);
    this.snapshot.avaliacoes = this.snapshot.avaliacoes.filter((a) => a.trabalhoId !== id);
    persistirDemo(this.snapshot);
  }

  async importarTrabalhos(trabalhos: Trabalho[]): Promise<Trabalho[]> {
    const mapa = new Map(this.snapshot.trabalhos.map((t) => [t.id, t]));
    trabalhos.forEach((t) => mapa.set(t.id, t));
    this.snapshot.trabalhos = [...mapa.values()].sort((a, b) => a.codigo.localeCompare(b.codigo));
    persistirDemo(this.snapshot);
    return trabalhos;
  }

  async atribuir(avaliadorId: string, trabalhoIds: string[]): Promise<Atribuicao[]> {
    const existentes = new Set(
      this.snapshot.atribuicoes
        .filter((a) => a.avaliadorId === avaliadorId)
        .map((a) => a.trabalhoId),
    );
    const novas: Atribuicao[] = [];
    trabalhoIds.forEach((trabalhoId) => {
      if (!existentes.has(trabalhoId)) {
        const atribuicao: Atribuicao = {
          id: `${trabalhoId}:${avaliadorId}`,
          trabalhoId,
          avaliadorId,
        };
        this.snapshot.atribuicoes.push(atribuicao);
        novas.push(atribuicao);
      }
    });
    persistirDemo(this.snapshot);
    return novas;
  }

  async desatribuir(avaliadorId: string, trabalhoId: string): Promise<void> {
    this.snapshot.atribuicoes = this.snapshot.atribuicoes.filter(
      (a) => !(a.avaliadorId === avaliadorId && a.trabalhoId === trabalhoId),
    );
    this.snapshot.avaliacoes = this.snapshot.avaliacoes.filter(
      (a) => !(a.avaliadorId === avaliadorId && a.trabalhoId === trabalhoId),
    );
    persistirDemo(this.snapshot);
  }

  async salvarMembro(membro: Membro): Promise<Membro> {
    const indice = this.snapshot.membros.findIndex((m) => m.id === membro.id);
    if (indice >= 0) this.snapshot.membros[indice] = membro;
    else this.snapshot.membros.push(membro);
    persistirDemo(this.snapshot);
    return membro;
  }

  async excluirMembro(id: string): Promise<void> {
    this.snapshot.membros = this.snapshot.membros.filter((m) => m.id !== id);
    this.snapshot.atribuicoes = this.snapshot.atribuicoes.filter((a) => a.avaliadorId !== id);
    this.snapshot.avaliacoes = this.snapshot.avaliacoes.filter((a) => a.avaliadorId !== id);
    persistirDemo(this.snapshot);
  }

  async resetarDemo(): Promise<void> {
    Object.values(CHAVES).forEach((chave) => localStorage.removeItem(chave));
    this.snapshot = seedDemo();
  }
}

interface MembroRow {
  id: string;
  user_id: string | null;
  nome: string;
  email: string;
  titulacao: string | null;
  instituicao: string | null;
  papel: Papel;
  ativo: boolean;
  ordem: number;
}

interface TrabalhoRow {
  id: string;
  codigo: string;
  titulo: string;
  sessao: number;
  categoria: number;
  apresentador: string | null;
  autores: string | null;
  orientador: string | null;
  instituicao: string | null;
  periodo: string | null;
  nivel: Trabalho['nivel'];
  resumo: string | null;
  link_pdf: string | null;
  observacoes: string | null;
}

interface AtribuicaoRow {
  id: string;
  trabalho_id: string;
  avaliador_id: string;
}

interface AvaliacaoRow {
  id: string;
  trabalho_id: string;
  avaliador_id: string;
  notas: Record<string, number> | null;
  nota_final: number | string;
  parecer: string | null;
  pontos_fortes: string | null;
  sugestoes: string | null;
  indicacao_mencao: boolean;
  justificativa_mencao: string | null;
  concluida: boolean;
  updated_at: string;
}

function membroDeRow(row: MembroRow): Membro {
  return {
    id: row.id,
    userId: row.user_id,
    nome: row.nome,
    email: row.email ?? '',
    titulacao: row.titulacao ?? '',
    instituicao: row.instituicao ?? '',
    papel: row.papel,
    ativo: row.ativo,
    ordem: row.ordem,
  };
}

function trabalhoDeRow(row: TrabalhoRow): Trabalho {
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

function trabalhoParaRow(trabalho: Trabalho): TrabalhoRow {
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

function normalizarNotas(bruto: unknown): Record<string, number> {
  const objeto = (bruto ?? {}) as Record<string, unknown>;
  const notas: Record<string, number> = {};
  Object.entries(objeto).forEach(([chave, valor]) => {
    const numero = Number(valor);
    const id = Number(chave);
    if (Number.isInteger(id) && id >= 1 && id <= 5 && Number.isInteger(numero) && numero >= 0 && numero <= 4) {
      notas[String(id)] = numero;
    }
  });
  return notas;
}

function avaliacaoDeRow(row: AvaliacaoRow): Avaliacao {
  return {
    id: row.id,
    trabalhoId: row.trabalho_id,
    avaliadorId: row.avaliador_id,
    notas: normalizarNotas(row.notas),
    notaFinal: Number(row.nota_final) || 0,
    parecer: row.parecer ?? '',
    pontosFortes: row.pontos_fortes ?? '',
    sugestoes: row.sugestoes ?? '',
    indicacaoMencao: Boolean(row.indicacao_mencao),
    justificativaMencao: row.justificativa_mencao ?? '',
    concluida: Boolean(row.concluida),
    atualizadoEm: row.updated_at,
  };
}

function avaliacaoParaRow(avaliacao: Avaliacao): AvaliacaoRow {
  return {
    id: avaliacao.id,
    trabalho_id: avaliacao.trabalhoId,
    avaliador_id: avaliacao.avaliadorId,
    notas: avaliacao.notas,
    nota_final: avaliacao.notaFinal,
    parecer: avaliacao.parecer,
    pontos_fortes: avaliacao.pontosFortes,
    sugestoes: avaliacao.sugestoes,
    indicacao_mencao: avaliacao.indicacaoMencao,
    justificativa_mencao: avaliacao.justificativaMencao,
    concluida: avaliacao.concluida,
    updated_at: avaliacao.atualizadoEm,
  };
}

export class SupabaseRepository implements Repositorio {
  modo: ModoDados = 'supabase';
  private get cliente() {
    if (!supabase) throw new Error('Supabase não configurado.');
    return supabase;
  }

  private async verificarSchema(): Promise<{ ok: boolean; aviso?: string }> {
    const { error } = await this.cliente
      .from('trabalhos')
      .select('id', { head: true, count: 'exact' })
      .limit(1);
    if (!error) {
      return { ok: true };
    }
    const mensagem = mensagemDeErro(error);
    const codigo = (error as { code?: string }).code;
    if (codigo === 'PGRST205' || mensagem.includes('schema ainda não foi aplicado')) {
      return {
        ok: false,
        aviso:
          'Supabase conectado, mas as tabelas do app ainda não existem. Rode supabase/migrations/0001_init.sql no SQL Editor do projeto. Enquanto isso, você pode explorar a demonstração local.',
      };
    }
    if (codigo === '42501' || mensagem.toLowerCase().includes('permission denied')) {
      return { ok: true };
    }
    return { ok: false, aviso: mensagem };
  }

  private async buscarMembro(userId: string): Promise<Membro | null> {
    const { data, error } = await this.cliente
      .from('avaliadores')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(mensagemDeErro(error));
    return data ? membroDeRow(data as MembroRow) : null;
  }

  private async carregarSnapshot(membro: Membro): Promise<Snapshot> {
    const colunasMembro =
      membro.papel === 'presidente'
        ? '*'
        : 'id,nome,titulacao,instituicao,papel,ativo,ordem';
    const [membrosRes, trabalhosRes, atribuicoesRes, avaliacoesRes] = await Promise.all([
      this.cliente.from('avaliadores').select(colunasMembro).eq('ativo', true).order('ordem'),
      this.cliente.from('trabalhos').select('*').order('codigo'),
      this.cliente.from('atribuicoes').select('*'),
      this.cliente.from('avaliacoes').select('*'),
    ]);
    const erro =
      membrosRes.error || trabalhosRes.error || atribuicoesRes.error || avaliacoesRes.error;
    if (erro) throw new Error(mensagemDeErro(erro));

    return {
      membros: (membrosRes.data ?? []).map((row) => membroDeRow(row as unknown as MembroRow)),
      trabalhos: (trabalhosRes.data ?? []).map((row) => trabalhoDeRow(row as TrabalhoRow)),
      atribuicoes: (atribuicoesRes.data ?? []).map((row) => {
        const r = row as AtribuicaoRow;
        return { id: r.id, trabalhoId: r.trabalho_id, avaliadorId: r.avaliador_id };
      }),
      avaliacoes: (avaliacoesRes.data ?? []).map((row) => avaliacaoDeRow(row as AvaliacaoRow)),
    };
  }

  async inicializar(): Promise<ResultadoInicializacao> {
    const vazio: Snapshot = { membros: [], trabalhos: [], atribuicoes: [], avaliacoes: [] };
    const schema = await this.verificarSchema();
    if (!schema.ok) {
      return { membro: null, snapshot: vazio, schemaOk: false, aviso: schema.aviso };
    }
    const { data, error } = await this.cliente.auth.getSession();
    if (error) {
      return { membro: null, snapshot: vazio, schemaOk: true, aviso: mensagemDeErro(error) };
    }
    const user = data.session?.user;
    if (!user) return { membro: null, snapshot: vazio, schemaOk: true };

    // Vincula automaticamente o usuário autenticado ao cadastro da comissão
    // cujo e-mail coincide. A função é security definer e idempotente.
    await this.cliente.rpc('vincular_meu_usuario');
    const membro = await this.buscarMembro(user.id);
    if (!membro || !membro.ativo) {
      await this.cliente.auth.signOut();
      return {
        membro: null,
        snapshot: vazio,
        schemaOk: true,
        aviso: membro
          ? 'Seu cadastro está inativo. Procure a presidência da comissão.'
          : 'Seu e-mail foi autenticado, mas não está cadastrado como membro da comissão. Peça à presidência para incluir seu e-mail na tabela avaliadores.',
      };
    }
    const snapshot = await this.carregarSnapshot(membro);
    return { membro, snapshot, schemaOk: true };
  }

  async entrar(email: string, senha: string): Promise<Membro> {
    const { data, error } = await this.cliente.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha,
    });
    if (error) throw new Error(mensagemDeErro(error));
    if (!data.user) throw new Error('Não foi possível iniciar a sessão.');

    await this.cliente.rpc('vincular_meu_usuario');
    const membro = await this.buscarMembro(data.user.id);
    if (!membro) {
      await this.cliente.auth.signOut();
      throw new Error(
        'Seu e-mail foi autenticado, mas não está cadastrado como membro da comissão. Peça à presidência para incluir seu e-mail na tabela avaliadores.',
      );
    }
    if (!membro.ativo) {
      await this.cliente.auth.signOut();
      throw new Error('Seu cadastro está inativo. Procure a presidência da comissão.');
    }
    return membro;
  }

  async entrarDemo(): Promise<Membro> {
    throw new Error('Use o modo demonstração para entrar sem senha.');
  }

  async sair(): Promise<void> {
    await this.cliente.auth.signOut();
  }

  async recarregar(): Promise<ResultadoInicializacao> {
    return this.inicializar();
  }

  async salvarAvaliacao(avaliacao: Avaliacao): Promise<Avaliacao> {
    const { data, error } = await this.cliente
      .from('avaliacoes')
      .upsert(avaliacaoParaRow(avaliacao), { onConflict: 'trabalho_id,avaliador_id' })
      .select('*')
      .single();
    if (error) throw new Error(mensagemDeErro(error));
    return avaliacaoDeRow(data as AvaliacaoRow);
  }

  async salvarTrabalho(trabalho: Trabalho): Promise<Trabalho> {
    const { data, error } = await this.cliente
      .from('trabalhos')
      .upsert(trabalhoParaRow(trabalho))
      .select('*')
      .single();
    if (error) throw new Error(mensagemDeErro(error));
    return trabalhoDeRow(data as TrabalhoRow);
  }

  async excluirTrabalho(id: string): Promise<void> {
    const { error } = await this.cliente.from('trabalhos').delete().eq('id', id);
    if (error) throw new Error(mensagemDeErro(error));
  }

  async importarTrabalhos(trabalhos: Trabalho[]): Promise<Trabalho[]> {
    if (trabalhos.length === 0) return [];
    const { data, error } = await this.cliente
      .from('trabalhos')
      .upsert(trabalhos.map(trabalhoParaRow))
      .select('*');
    if (error) throw new Error(mensagemDeErro(error));
    return (data ?? []).map((row) => trabalhoDeRow(row as TrabalhoRow));
  }

  async atribuir(avaliadorId: string, trabalhoIds: string[]): Promise<Atribuicao[]> {
    if (trabalhoIds.length === 0) return [];
    const rows = trabalhoIds.map((trabalhoId) => ({
      id: `${trabalhoId}:${avaliadorId}`,
      trabalho_id: trabalhoId,
      avaliador_id: avaliadorId,
    }));
    const { data, error } = await this.cliente
      .from('atribuicoes')
      .upsert(rows, { onConflict: 'trabalho_id,avaliador_id' })
      .select('*');
    if (error) throw new Error(mensagemDeErro(error));
    return (data ?? []).map((row) => {
      const r = row as AtribuicaoRow;
      return { id: r.id, trabalhoId: r.trabalho_id, avaliadorId: r.avaliador_id };
    });
  }

  async desatribuir(avaliadorId: string, trabalhoId: string): Promise<void> {
    const { error } = await this.cliente
      .from('atribuicoes')
      .delete()
      .eq('avaliador_id', avaliadorId)
      .eq('trabalho_id', trabalhoId);
    if (error) throw new Error(mensagemDeErro(error));
    const { error: erroAvaliacao } = await this.cliente
      .from('avaliacoes')
      .delete()
      .eq('avaliador_id', avaliadorId)
      .eq('trabalho_id', trabalhoId);
    if (erroAvaliacao) throw new Error(mensagemDeErro(erroAvaliacao));
  }

  async salvarMembro(membro: Membro): Promise<Membro> {
    const { data, error } = await this.cliente
      .from('avaliadores')
      .upsert({
        id: membro.id || uid('membro'),
        user_id: membro.userId ?? null,
        nome: membro.nome,
        email: membro.email.toLowerCase(),
        titulacao: membro.titulacao,
        instituicao: membro.instituicao,
        papel: membro.papel,
        ativo: membro.ativo,
        ordem: membro.ordem,
      })
      .select('*')
      .single();
    if (error) throw new Error(mensagemDeErro(error));
    return membroDeRow(data as MembroRow);
  }

  async excluirMembro(id: string): Promise<void> {
    const { error } = await this.cliente.from('avaliadores').delete().eq('id', id);
    if (error) throw new Error(mensagemDeErro(error));
  }

  async resetarDemo(): Promise<void> {
    throw new Error('No modo Supabase os dados são gerenciados pelo banco.');
  }
}

export function criarRepositorio(modo: ModoDados): Repositorio {
  return modo === 'supabase' ? new SupabaseRepository() : new DemoRepository();
}

export { PREFIXO as PREFIXO_ARMAZENAMENTO };
