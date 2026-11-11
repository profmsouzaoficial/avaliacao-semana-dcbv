import { useMemo, useState } from 'react';
import { Mail, Pencil, Plus, ShieldAlert, Trash2, UserCheck, UserX } from 'lucide-react';
import type { Membro } from '../types';
import { useApp } from '../context/AppContext';
import { classNames, contar, iniciais } from '../lib/format';
import { Badge } from './Badge';
import { Button } from './Button';

interface MembersPanelProps {
  onNovo: () => void;
  onEditar: (membro: Membro) => void;
  onExcluir: (membro: Membro) => void;
}

export function MembersPanel({ onNovo, onEditar, onExcluir }: MembersPanelProps) {
  const { membros, atribuicoes, avaliacoes, membro: membroAtual, modo } = useApp();
  const [busca, setBusca] = useState('');

  const ordenados = useMemo(
    () =>
      membros
        .filter((m) => {
          const termo = busca.trim().toLowerCase();
          return (
            !termo ||
            m.nome.toLowerCase().includes(termo) ||
            m.email.toLowerCase().includes(termo)
          );
        })
        .slice()
        .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome)),
    [membros, busca],
  );

  const ativos = membros.filter((m) => m.ativo).length;
  const presidentes = membros.filter((m) => m.papel === 'presidente').length;
  const presidentesAtivos = membros.filter((m) => m.papel === 'presidente' && m.ativo).length;
  const avaliadores = membros.filter((m) => m.papel === 'avaliador').length;

  const podeExcluir = (membro: Membro): { ok: boolean; motivo: string } => {
    if (membro.id === membroAtual?.id) {
      return { ok: false, motivo: 'Você não pode excluir o próprio acesso.' };
    }
    if (membro.papel === 'presidente' && membro.ativo && presidentesAtivos <= 1) {
      return { ok: false, motivo: 'É a única presidência. Cadastre outra antes de excluir.' };
    }
    return { ok: true, motivo: '' };
  };

  return (
    <div className="space-y-3">
      <div className="card px-4 py-3.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome ou e-mail"
                className="h-9 w-full rounded-xl border border-line bg-paper-light pl-9 pr-3 text-[11.5px] text-ink outline-none placeholder:text-ink-muted/70 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge tom="green" ponto>{contar(ativos, 'ativo', 'ativos')}</Badge>
              <Badge tom="neutral">{contar(avaliadores, 'avaliador', 'avaliadores')}</Badge>
              <Badge tom="brand">{contar(presidentes, 'presidência', 'presidências')}</Badge>
            </div>
          </div>
          <Button variante="primary" tamanho="sm" onClick={onNovo} icone={<Plus className="h-3.5 w-3.5" />}>
            Novo membro
          </Button>
        </div>
        <p className="mt-2.5 border-t border-line-soft pt-2.5 text-[10px] leading-relaxed text-ink-muted">
          {modo === 'supabase'
            ? 'Cada membro precisa de um usuário no Supabase Auth com o mesmo e-mail. O vínculo é feito automaticamente no primeiro login.'
            : 'Modo demonstração: clique em um membro na tela de entrada para assumir o papel dele. Não há senha.'}
        </p>
      </div>

      <div className="card hidden overflow-hidden sm:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line-soft bg-paper-light">
              <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-ink-muted">Membro</th>
              <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-ink-muted">Papel</th>
              <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-ink-muted">Titulação / instituição</th>
              <th className="px-3 py-2.5 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-ink-muted">Atribuições</th>
              <th className="px-3 py-2.5 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-ink-muted">Status</th>
              <th className="px-3 py-2.5 text-right text-[9px] font-bold uppercase tracking-[0.12em] text-ink-muted">Ações</th>
            </tr>
          </thead>
          <tbody>
            {ordenados.map((membro) => {
              const atribuidas = atribuicoes.filter((a) => a.avaliadorId === membro.id).length;
              const concluidas = avaliacoes.filter(
                (a) => a.avaliadorId === membro.id && a.concluida,
              ).length;
              const exclusao = podeExcluir(membro);
              return (
                <tr key={membro.id} className="border-b border-line-soft/70 transition hover:bg-brand-50/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={classNames(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] font-bold',
                          membro.papel === 'presidente' ? 'bg-brand-800 text-white' : 'bg-brand-50 text-brand-700',
                        )}
                      >
                        {iniciais(membro.nome)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[12px] font-semibold text-ink">{membro.nome}</span>
                          {membro.id === membroAtual?.id && <Badge tom="brand" className="scale-90">você</Badge>}
                        </div>
                        <div className="flex items-center gap-1 truncate text-[9.5px] text-ink-muted">
                          <Mail className="h-2.5 w-2.5" /> {membro.email}
                        </div>
                        {membro.userId && (
                          <div className="mt-0.5 inline-flex items-center gap-1 text-[8.5px] text-emerald-700">
                            <UserCheck className="h-2.5 w-2.5" /> login vinculado
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tom={membro.papel === 'presidente' ? 'brand' : 'neutral'}>
                      {membro.papel === 'presidente' ? 'presidência' : 'avaliador(a)'}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-[10.5px] text-ink-soft">{membro.titulacao || '—'}</div>
                    <div className="text-[9px] text-ink-muted">{membro.instituicao || 'instituição não informada'}</div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="text-[11px] font-semibold text-ink">{atribuidas}</div>
                    <div className="text-[8.5px] text-ink-muted">{contar(concluidas, 'concluída', 'concluídas')}</div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Badge tom={membro.ativo ? 'green' : 'rose'} ponto>
                      {membro.ativo ? 'ativo' : 'inativo'}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEditar(membro)}
                        className="rounded-lg p-1.5 text-ink-muted transition hover:bg-white hover:text-brand-700"
                        aria-label={`Editar ${membro.nome}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onExcluir(membro)}
                        disabled={!exclusao.ok}
                        title={exclusao.motivo || `Excluir ${membro.nome}`}
                        className="rounded-lg p-1.5 text-ink-muted transition hover:bg-rose-100 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label={`Excluir ${membro.nome}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 sm:hidden">
        {ordenados.map((membro) => {
          const atribuidas = atribuicoes.filter((a) => a.avaliadorId === membro.id).length;
          const concluidas = avaliacoes.filter((a) => a.avaliadorId === membro.id && a.concluida).length;
          const exclusao = podeExcluir(membro);
          return (
            <div key={membro.id} className="card px-4 py-3">
              <div className="flex items-start gap-2.5">
                <span
                  className={classNames(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                    membro.papel === 'presidente' ? 'bg-brand-800 text-white' : 'bg-brand-50 text-brand-700',
                  )}
                >
                  {iniciais(membro.nome)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[12px] font-semibold text-ink">{membro.nome}</span>
                    <Badge tom={membro.papel === 'presidente' ? 'brand' : 'neutral'} className="scale-90">
                      {membro.papel === 'presidente' ? 'presidência' : 'avaliador(a)'}
                    </Badge>
                    <Badge tom={membro.ativo ? 'green' : 'rose'} ponto className="scale-90">
                      {membro.ativo ? 'ativo' : 'inativo'}
                    </Badge>
                  </div>
                  <p className="truncate text-[10px] text-ink-muted">{membro.email}</p>
                  <p className="mt-0.5 text-[9.5px] text-ink-muted">
                    {membro.titulacao || 'titulação não informada'} · {contar(atribuidas, 'atribuída', 'atribuídas')} · {contar(concluidas, 'concluída', 'concluídas')}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => onEditar(membro)}
                    className="rounded-lg border border-line p-1.5 text-ink-muted hover:bg-brand-50 hover:text-brand-700"
                    aria-label={`Editar ${membro.nome}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onExcluir(membro)}
                    disabled={!exclusao.ok}
                    className="rounded-lg border border-line p-1.5 text-ink-muted hover:bg-rose-100 hover:text-rose-600 disabled:opacity-30"
                    aria-label={`Excluir ${membro.nome}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {ordenados.length === 0 && (
        <div className="card px-5 py-10 text-center">
          <UserX className="mx-auto h-7 w-7 text-ink-muted" />
          <p className="mt-2 font-serif text-[17px] font-semibold text-ink">Nenhum membro encontrado</p>
          <p className="mt-1 text-[11.5px] text-ink-muted">Ajuste a busca ou cadastre um novo membro.</p>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-2xl border border-line bg-paper-light px-4 py-3 text-[10.5px] leading-relaxed text-ink-muted">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
        <p>
          O papel <strong>presidência</strong> vê todos os trabalhos, avaliações e a ata. O papel{' '}
          <strong>avaliador(a)</strong> vê apenas os trabalhos atribuídos a si. Um membro inativo
          mantém o histórico, mas não recebe novas atribuições.
        </p>
      </div>
    </div>
  );
}
