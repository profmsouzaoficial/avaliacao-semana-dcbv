import { useEffect, useState } from 'react';
import { AlertTriangle, Save, UserCog, UserRound } from 'lucide-react';
import type { Membro, Papel } from '../types';
import { useApp } from '../context/AppContext';
import { mensagemDeErro } from '../lib/supabase';
import { classNames } from '../lib/format';
import { Button } from './Button';
import { Modal } from './Modal';

interface MembroModalProps {
  aberto: boolean;
  membro: Membro | null;
  onFechar: () => void;
}

interface Formulario {
  nome: string;
  email: string;
  titulacao: string;
  instituicao: string;
  papel: Papel;
  ativo: boolean;
  ordem: number;
}

export function MembroModal({ aberto, membro, onFechar }: MembroModalProps) {
  const { membros, membro: membroAtual, salvarMembro, notificar, modo } = useApp();
  const [form, setForm] = useState<Formulario>({
    nome: '',
    email: '',
    titulacao: '',
    instituicao: '',
    papel: 'avaliador',
    ativo: true,
    ordem: 1,
  });
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setErro(null);
    if (membro) {
      setForm({
        nome: membro.nome,
        email: membro.email,
        titulacao: membro.titulacao,
        instituicao: membro.instituicao,
        papel: membro.papel,
        ativo: membro.ativo,
        ordem: membro.ordem,
      });
    } else {
      setForm({
        nome: '',
        email: '',
        titulacao: '',
        instituicao: '',
        papel: 'avaliador',
        ativo: true,
        ordem: membros.length + 1,
      });
    }
  }, [aberto, membro, membros.length]);

  const atualizar = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) => {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setErro(null);
  };

  const salvar = async () => {
    if (salvando) return;
    setErro(null);
    if (!form.nome.trim()) {
      setErro('Informe o nome do membro.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setErro('Informe um e-mail válido.');
      return;
    }
    if (
      membros.some(
        (m) =>
          m.email.trim().toLowerCase() === form.email.trim().toLowerCase() && m.id !== membro?.id,
      )
    ) {
      setErro('Já existe um membro com este e-mail.');
      return;
    }

    if (
      membro &&
      membroAtual?.id === membro.id &&
      membro.papel === 'presidente' &&
      membro.ativo &&
      (form.papel !== 'presidente' || !form.ativo) &&
      !membros.some(
        (m) => m.id !== membro.id && m.papel === 'presidente' && m.ativo,
      )
    ) {
      setErro('Você é a única presidência ativa. Cadastre outra presidência antes de mudar seu papel ou desativar seu acesso.');
      return;
    }

    setSalvando(true);
    try {
      const id =
        membro?.id ??
        (typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `membro-${Date.now()}-${Math.random().toString(16).slice(2)}`);
      await salvarMembro({
        id,
        userId: membro?.userId ?? null,
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        titulacao: form.titulacao.trim(),
        instituicao: form.instituicao.trim(),
        papel: form.papel,
        ativo: form.ativo,
        ordem: Number.isFinite(form.ordem) ? form.ordem : membros.length + 1,
      });
      notificar(
        membro ? `${form.nome.trim()} atualizado.` : `${form.nome.trim()} cadastrado(a).`,
        'sucesso',
      );
      onFechar();
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo={membro ? 'Editar membro' : 'Novo membro da banca'}
      descricao="Avaliadores e presidência acessam o sistema com o e-mail cadastrado."
      largura="md"
      rodape={
        <>
          <Button variante="ghost" onClick={onFechar}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-membro"
            carregando={salvando}
            icone={<Save className="h-4 w-4" />}
          >
            {membro ? 'Salvar alterações' : 'Cadastrar membro'}
          </Button>
        </>
      }
    >
      <form
        id="form-membro"
        onSubmit={(e) => {
          e.preventDefault();
          void salvar();
        }}
        className="space-y-4"
      >
        {erro && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-100/70 px-3.5 py-2.5 text-[12px] leading-relaxed text-rose-600">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {erro}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[11.5px] font-semibold text-ink-soft">Nome completo *</span>
            <input
              value={form.nome}
              onChange={(e) => atualizar('nome', e.target.value)}
              placeholder="Prof. Dr. Nome Sobrenome"
              className="h-10 w-full rounded-xl border border-line bg-paper-light px-3 text-[12.5px] text-ink outline-none transition placeholder:text-ink-muted/60 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[11.5px] font-semibold text-ink-soft">E-mail *</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => atualizar('email', e.target.value)}
              placeholder="nome@ufjf.br"
              className="h-10 w-full rounded-xl border border-line bg-paper-light px-3 text-[12px] text-ink outline-none transition placeholder:text-ink-muted/60 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
            />
            <span className="mt-1 block text-[9.5px] leading-relaxed text-ink-muted">
              {modo === 'supabase'
                ? 'Precisa corresponder a um usuário criado no Supabase Auth. O vínculo é feito no primeiro login.'
                : 'Na demonstração, o e-mail é apenas um rótulo; não há senha.'}
            </span>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-ink-soft">Titulação</span>
            <input
              value={form.titulacao}
              onChange={(e) => atualizar('titulacao', e.target.value)}
              placeholder="Doutorado"
              className="h-10 w-full rounded-xl border border-line bg-paper-light px-3 text-[12px] text-ink outline-none transition placeholder:text-ink-muted/60 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-ink-soft">Instituição</span>
            <input
              value={form.instituicao}
              onChange={(e) => atualizar('instituicao', e.target.value)}
              placeholder="UFJF – Campus GV"
              className="h-10 w-full rounded-xl border border-line bg-paper-light px-3 text-[12px] text-ink outline-none transition placeholder:text-ink-muted/60 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-ink-soft">Ordem de exibição</span>
            <input
              type="number"
              min={1}
              value={form.ordem}
              onChange={(e) => atualizar('ordem', Number(e.target.value))}
              className="h-10 w-full rounded-xl border border-line bg-paper-light px-3 text-[12px] text-ink outline-none focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
            />
          </label>
          <label className="flex items-end gap-2 pb-2">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => atualizar('ativo', e.target.checked)}
              className="h-4 w-4 rounded border-line text-brand-700 accent-brand-700"
            />
            <span className="text-[11.5px] font-medium text-ink-soft">
              Ativo — pode receber atribuições
            </span>
          </label>
        </div>

        <div>
          <span className="mb-1.5 block text-[11.5px] font-semibold text-ink-soft">Papel no sistema</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                {
                  valor: 'avaliador' as Papel,
                  titulo: 'Avaliador(a)',
                  descricao: 'Avalia apenas os trabalhos atribuídos a si.',
                  icone: UserRound,
                },
                {
                  valor: 'presidente' as Papel,
                  titulo: 'Presidência',
                  descricao: 'Vê todos os dados, faz a curadoria e gera a ata.',
                  icone: UserCog,
                },
              ] as const
            ).map((opcao) => {
              const Icone = opcao.icone;
              const ativo = form.papel === opcao.valor;
              return (
                <button
                  key={opcao.valor}
                  type="button"
                  onClick={() => atualizar('papel', opcao.valor)}
                  className={classNames(
                    'rounded-2xl border p-3 text-left transition',
                    ativo
                      ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-100'
                      : 'border-line bg-paper-light hover:border-brand-300',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icone className={classNames('h-4 w-4', ativo ? 'text-brand-700' : 'text-ink-muted')} />
                    <span className="text-[12px] font-semibold text-ink">{opcao.titulo}</span>
                  </div>
                  <p className="mt-1 text-[10px] leading-snug text-ink-muted">{opcao.descricao}</p>
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
}
