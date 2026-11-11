import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Save } from 'lucide-react';
import type { NivelParticipante, Trabalho } from '../types';
import { CATEGORIAS, SESSOES, categoriaPorNumero } from '../data/event';
import { useApp } from '../context/AppContext';
import { contar } from '../lib/format';
import { mensagemDeErro } from '../lib/supabase';
import { Badge } from './Badge';
import { Button } from './Button';
import { Modal } from './Modal';

interface TrabalhoModalProps {
  aberto: boolean;
  trabalho: Trabalho | null;
  onFechar: () => void;
}

interface Formulario {
  codigo: string;
  titulo: string;
  sessao: number;
  categoria: number;
  apresentador: string;
  autores: string;
  orientador: string;
  instituicao: string;
  periodo: string;
  nivel: NivelParticipante;
  resumo: string;
  linkPdf: string;
  observacoes: string;
}

const VAZIO: Formulario = {
  codigo: '',
  titulo: '',
  sessao: 0,
  categoria: 0,
  apresentador: '',
  autores: '',
  orientador: '',
  instituicao: '',
  periodo: '',
  nivel: 'outro',
  resumo: '',
  linkPdf: '',
  observacoes: '',
};

export function TrabalhoModal({ aberto, trabalho, onFechar }: TrabalhoModalProps) {
  const { trabalhos, avaliacoes, salvarTrabalho, notificar } = useApp();
  const [form, setForm] = useState<Formulario>(VAZIO);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setErro(null);
    if (trabalho) {
      setForm({
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
        linkPdf: trabalho.linkPdf,
        observacoes: trabalho.observacoes,
      });
    } else {
      setForm(VAZIO);
    }
  }, [aberto, trabalho]);

  const atualizar = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) => {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setErro(null);
  };

  const avaliacoesDoTrabalho = trabalho
    ? avaliacoes.filter((a) => a.trabalhoId === trabalho.id).length
    : 0;

  const salvar = async () => {
    if (salvando) return;
    setErro(null);
    const codigo = form.codigo.trim().replace(/\s+/g, '');
    if (!/^\d{2}\.\d{2}$/.test(codigo)) {
      setErro('O código deve seguir o padrão NN.NN, por exemplo 03.07.');
      return;
    }
    if (
      trabalhos.some(
        (t) => t.codigo.toLowerCase() === codigo.toLowerCase() && t.id !== trabalho?.id,
      )
    ) {
      setErro(`Já existe um trabalho com o código ${codigo}.`);
      return;
    }
    if (!form.titulo.trim()) {
      setErro('Informe o título do trabalho.');
      return;
    }
    if (form.sessao < 1 || form.sessao > 7) {
      setErro('Selecione a sessão temática.');
      return;
    }
    if (form.categoria < 1 || form.categoria > 5) {
      setErro('Selecione a categoria do trabalho.');
      return;
    }

    setSalvando(true);
    try {
      const id = trabalho?.id ?? codigo;
      await salvarTrabalho({
        id,
        codigo,
        titulo: form.titulo.trim(),
        sessao: form.sessao,
        categoria: form.categoria,
        apresentador: form.apresentador.trim(),
        autores: form.autores.trim(),
        orientador: form.orientador.trim(),
        instituicao: form.instituicao.trim(),
        periodo: form.periodo.trim(),
        nivel: form.nivel,
        resumo: form.resumo.trim(),
        linkPdf: form.linkPdf.trim(),
        observacoes: form.observacoes.trim(),
      });
      notificar(
        trabalho ? `Trabalho ${codigo} atualizado.` : `Trabalho ${codigo} cadastrado.`,
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
      titulo={trabalho ? `Editar ${trabalho.codigo}` : 'Novo trabalho'}
      descricao={
        trabalho
          ? 'As notas já registradas permanecem; sessão e categoria organizam o ranking.'
          : 'Cadastre um banner aprovado. O código é a chave do trabalho e será usado na importação.'
      }
      largura="lg"
      rodape={
        <>
          <Button variante="ghost" onClick={onFechar}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-trabalho"
            carregando={salvando}
            icone={<Save className="h-4 w-4" />}
          >
            {trabalho ? 'Salvar alterações' : 'Cadastrar trabalho'}
          </Button>
        </>
      }
    >
      <form
        id="form-trabalho"
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

        {trabalho && avaliacoesDoTrabalho > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-accent-200 bg-accent-50 px-3.5 py-2.5 text-[11.5px] leading-relaxed text-accent-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Este trabalho já tem {contar(avaliacoesDoTrabalho, 'avaliação registrada', 'avaliações registradas')}. Alterar a sessão
            ou a categoria muda o agrupamento no painel, mas não recalcula as notas.
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-ink-soft">Código *</span>
            <input
              value={form.codigo}
              onChange={(e) => atualizar('codigo', e.target.value)}
              disabled={Boolean(trabalho)}
              placeholder="03.07"
              inputMode="numeric"
              className="h-10 w-full rounded-xl border border-line bg-paper-light px-3 font-mono text-[12.5px] text-ink outline-none transition placeholder:text-ink-muted/60 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-paper-deep disabled:text-ink-muted"
            />
            <span className="mt-1 block text-[9.5px] text-ink-muted">
              {trabalho
                ? 'O código identifica o trabalho e não pode ser alterado.'
                : 'Padrão NN.NN, como no parecer oficial.'}
            </span>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-ink-soft">Nível *</span>
            <select
              value={form.nivel}
              onChange={(e) => atualizar('nivel', e.target.value as NivelParticipante)}
              className="h-10 w-full rounded-xl border border-line bg-paper-light px-2.5 text-[12px] text-ink outline-none focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
            >
              <option value="outro">Não informado</option>
              <option value="graduacao">Graduação</option>
              <option value="pos-graduacao">Pós-graduação</option>
              <option value="docente">Docência</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-[11.5px] font-semibold text-ink-soft">Título *</span>
          <textarea
            value={form.titulo}
            onChange={(e) => atualizar('titulo', e.target.value)}
            rows={2}
            placeholder="Título do trabalho como consta no parecer"
            className="w-full resize-y rounded-xl border border-line bg-paper-light px-3 py-2.5 text-[12.5px] leading-relaxed text-ink outline-none transition placeholder:text-ink-muted/60 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-ink-soft">Sessão temática *</span>
            <select
              value={form.sessao}
              onChange={(e) => atualizar('sessao', Number(e.target.value))}
              className="h-10 w-full rounded-xl border border-line bg-paper-light px-2.5 text-[12px] text-ink outline-none focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
            >
              <option value={0}>Selecione…</option>
              {SESSOES.map((s) => (
                <option key={s.numero} value={s.numero}>
                  {String(s.numero).padStart(2, '0')} · {s.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-ink-soft">Categoria *</span>
            <select
              value={form.categoria}
              onChange={(e) => atualizar('categoria', Number(e.target.value))}
              className="h-10 w-full rounded-xl border border-line bg-paper-light px-2.5 text-[12px] text-ink outline-none focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
            >
              <option value={0}>Selecione…</option>
              {CATEGORIAS.map((c) => (
                <option key={c.numero} value={c.numero}>
                  {c.numero} · {c.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        {form.categoria > 0 && (
          <div className="rounded-xl border border-line-soft bg-paper-light px-3 py-2 text-[10.5px] leading-relaxed text-ink-muted">
            <strong className="text-ink-soft">O que observar nesta categoria:</strong>{' '}
            {categoriaPorNumero(form.categoria).orientacaoMetodo}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Apresentador(a)" valor={form.apresentador} onChange={(v) => atualizar('apresentador', v)} placeholder="Nome de quem apresenta" />
          <Campo rotulo="Orientador(a)" valor={form.orientador} onChange={(v) => atualizar('orientador', v)} placeholder="Nome do(a) orientador(a)" />
          <Campo rotulo="Autoria" valor={form.autores} onChange={(v) => atualizar('autores', v)} placeholder="Autores separados por vírgula" />
          <Campo rotulo="Instituição" valor={form.instituicao} onChange={(v) => atualizar('instituicao', v)} placeholder="UFJF – Campus GV" />
          <Campo rotulo="Período" valor={form.periodo} onChange={(v) => atualizar('periodo', v)} placeholder="Ex.: 3º" />
          <Campo rotulo="Link do PDF" valor={form.linkPdf} onChange={(v) => atualizar('linkPdf', v)} placeholder="https://…" tipo="url" />
        </div>

        <label className="block">
          <span className="mb-1 flex items-center justify-between gap-2">
            <span className="text-[11.5px] font-semibold text-ink-soft">Resumo</span>
            <span className="text-[9.5px] text-ink-muted">{form.resumo.length}/4000</span>
          </span>
          <textarea
            value={form.resumo}
            onChange={(e) => atualizar('resumo', e.target.value)}
            rows={4}
            maxLength={4000}
            placeholder="Opcional. O parecer de aprovação traz apenas os títulos; cole aqui o resumo se tiver o arquivo."
            className="w-full resize-y rounded-xl border border-line bg-paper-light px-3 py-2.5 text-[12px] leading-relaxed text-ink outline-none transition placeholder:text-ink-muted/60 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[11.5px] font-semibold text-ink-soft">Observações internas</span>
          <textarea
            value={form.observacoes}
            onChange={(e) => atualizar('observacoes', e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Opcional. Visível apenas para a comissão."
            className="w-full resize-y rounded-xl border border-line bg-paper-light px-3 py-2.5 text-[12px] leading-relaxed text-ink outline-none transition placeholder:text-ink-muted/60 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-brand-50/60 px-3 py-2 text-[10.5px] text-brand-800">
          <Check className="h-3.5 w-3.5" />
          O trabalho entra no painel assim que for salvo. A distribuição para avaliadores é feita na
          aba <Badge tom="brand" className="scale-90">Distribuição</Badge>.
        </div>
      </form>
    </Modal>
  );
}

function Campo({
  rotulo,
  valor,
  onChange,
  placeholder,
  tipo = 'text',
}: {
  rotulo: string;
  valor: string;
  onChange: (valor: string) => void;
  placeholder: string;
  tipo?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11.5px] font-semibold text-ink-soft">{rotulo}</span>
      <input
        type={tipo}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-line bg-paper-light px-3 text-[12px] text-ink outline-none transition placeholder:text-ink-muted/60 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
      />
    </label>
  );
}
