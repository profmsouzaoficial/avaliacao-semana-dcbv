import { useRef, useState, type ReactNode } from 'react';
import {
  ArrowRightLeft,
  CheckCircle2,
  Database,
  FileWarning,
  Info,
  Layers,
  Upload,
  Users,
} from 'lucide-react';
import type { Membro, Trabalho } from '../types';
import type { ResultadoImportacao } from '../lib/csv';
import {
  MODELO_CSV,
  baixarArquivo,
  csvParaTrabalhos,
  trabalhosParaCsv,
} from '../lib/csv';
import { useApp } from '../context/AppContext';
import { mensagemDeErro } from '../lib/supabase';
import { classNames, contar } from '../lib/format';
import { Badge } from './Badge';
import { Button } from './Button';
import { Modal } from './Modal';
import { WorksPanel } from './WorksPanel';
import { MembersPanel } from './MembersPanel';
import { DistributionMatrix } from './DistributionMatrix';
import { TrabalhoModal } from './TrabalhoModal';
import { MembroModal } from './MembroModal';

type AbaCuradoria = 'trabalhos' | 'membros' | 'distribuicao';

export function CuradoriaView() {
  const {
    modo,
    trabalhos,
    membros,
    atribuicoes,
    avaliacoes,
    excluirTrabalho,
    excluirMembro,
    importarTrabalhos,
    resetarDemo,
    notificar,
  } = useApp();
  const [aba, setAba] = useState<AbaCuradoria>('trabalhos');
  const [trabalhoModal, setTrabalhoModal] = useState(false);
  const [trabalhoEditando, setTrabalhoEditando] = useState<Trabalho | null>(null);
  const [membroModal, setMembroModal] = useState(false);
  const [membroEditando, setMembroEditando] = useState<Membro | null>(null);
  const [trabalhoParaExcluir, setTrabalhoParaExcluir] = useState<Trabalho | null>(null);
  const [membroParaExcluir, setMembroParaExcluir] = useState<Membro | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [importResultado, setImportResultado] = useState<ResultadoImportacao | null>(null);
  const [importando, setImportando] = useState(false);
  const [resetando, setResetando] = useState(false);
  const arquivoRef = useRef<HTMLInputElement>(null);

  const abas: { id: AbaCuradoria; rotulo: string; icone: typeof Layers; contagem: number }[] = [
    { id: 'trabalhos', rotulo: 'Trabalhos', icone: Layers, contagem: trabalhos.length },
    { id: 'membros', rotulo: 'Membros', icone: Users, contagem: membros.length },
    { id: 'distribuicao', rotulo: 'Distribuição', icone: ArrowRightLeft, contagem: atribuicoes.length },
  ];

  const abrirNovoTrabalho = () => {
    setTrabalhoEditando(null);
    setTrabalhoModal(true);
  };

  const abrirEditarTrabalho = (trabalho: Trabalho) => {
    setTrabalhoEditando(trabalho);
    setTrabalhoModal(true);
  };

  const abrirNovoMembro = () => {
    setMembroEditando(null);
    setMembroModal(true);
  };

  const abrirEditarMembro = (membro: Membro) => {
    setMembroEditando(membro);
    setMembroModal(true);
  };

  const confirmarExclusaoTrabalho = async () => {
    if (!trabalhoParaExcluir) return;
    setExcluindo(true);
    try {
      await excluirTrabalho(trabalhoParaExcluir.id);
      notificar(`Trabalho ${trabalhoParaExcluir.codigo} excluído.`, 'info');
      setTrabalhoParaExcluir(null);
    } catch (e) {
      notificar(mensagemDeErro(e), 'erro');
    } finally {
      setExcluindo(false);
    }
  };

  const confirmarExclusaoMembro = async () => {
    if (!membroParaExcluir) return;
    setExcluindo(true);
    try {
      await excluirMembro(membroParaExcluir.id);
      notificar(`${membroParaExcluir.nome} excluído(a).`, 'info');
      setMembroParaExcluir(null);
    } catch (e) {
      notificar(mensagemDeErro(e), 'erro');
    } finally {
      setExcluindo(false);
    }
  };

  const processarImportacao = async (arquivo: File) => {
    setImportando(true);
    try {
      const texto = await arquivo.text();
      const resultado = csvParaTrabalhos(texto);
      if (resultado.trabalhos.length > 0) {
        await importarTrabalhos(resultado.trabalhos);
        notificar(
          `${contar(resultado.trabalhos.length, 'trabalho importado', 'trabalhos importados')}. Códigos existentes foram atualizados.`,
          'sucesso',
        );
      }
      setImportResultado(resultado);
    } catch (e) {
      notificar(mensagemDeErro(e), 'erro');
    } finally {
      setImportando(false);
    }
  };

  const exportarTrabalhos = () => {
    baixarArquivo('trabalhos-dcbv.csv', trabalhosParaCsv(trabalhos));
    notificar('Lista de trabalhos exportada em CSV.', 'sucesso');
  };

  const baixarModelo = () => {
    baixarArquivo('modelo-trabalhos-dcbv.csv', MODELO_CSV);
    notificar('Modelo baixado. Apague a linha de exemplo antes de importar.', 'info');
  };

  const reiniciarDemo = async () => {
    if (
      !window.confirm(
        'Reiniciar a demonstração?\n\nTodas as alterações salvas neste navegador serão apagadas e os dados originais serão restaurados.',
      )
    ) {
      return;
    }
    setResetando(true);
    try {
      await resetarDemo();
    } catch (e) {
      notificar(mensagemDeErro(e), 'erro');
    } finally {
      setResetando(false);
    }
  };

  const atribuicoesDoTrabalho = trabalhoParaExcluir
    ? atribuicoes.filter((a) => a.trabalhoId === trabalhoParaExcluir.id).length
    : 0;
  const avaliacoesDoTrabalho = trabalhoParaExcluir
    ? avaliacoes.filter((a) => a.trabalhoId === trabalhoParaExcluir.id).length
    : 0;
  const atribuicoesDoMembro = membroParaExcluir
    ? atribuicoes.filter((a) => a.avaliadorId === membroParaExcluir.id).length
    : 0;
  const avaliacoesDoMembro = membroParaExcluir
    ? avaliacoes.filter((a) => a.avaliadorId === membroParaExcluir.id).length
    : 0;

  return (
    <div>
      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow">Curadoria</span>
          <Badge tom={modo === 'demo' ? 'amber' : 'green'} ponto>
            {modo === 'demo' ? 'demonstração · localStorage' : 'Supabase · dados reais'}
          </Badge>
        </div>
        <h1 className="display mt-1.5 text-[29px] font-semibold leading-tight tracking-tight text-ink sm:text-[36px]">
          Dados do evento
        </h1>
        <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-ink-muted">
          Cadastre os trabalhos aprovados, os membros da banca e a distribuição das avaliações. As
          alterações valem imediatamente para toda a equipe.
        </p>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <Passo
          numero="1"
          titulo="Traga os trabalhos"
          texto="Importe o CSV do parecer ou cadastre manualmente. O código NN.NN é a chave."
          ativo={aba === 'trabalhos'}
        />
        <Passo
          numero="2"
          titulo="Cadastre a banca"
          texto="Convide avaliadores e defina quem é a presidência. Cada pessoa acessa com seu e-mail."
          ativo={aba === 'membros'}
        />
        <Passo
          numero="3"
          titulo="Distribua as avaliações"
          texto="Cada trabalho deve ter dois avaliadores. Acompanhe a cobertura no painel."
          ativo={aba === 'distribuicao'}
        />
      </div>

      <div className="scrollbar-thin mb-3 inline-flex max-w-full overflow-x-auto rounded-2xl border border-line bg-white p-1 shadow-sm">
        {abas.map((item) => {
          const Icone = item.icone;
          const ativo = aba === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setAba(item.id)}
              className={classNames(
                'inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11.5px] font-semibold transition',
                ativo ? 'bg-brand-900 text-white shadow-sm' : 'text-ink-muted hover:bg-paper hover:text-ink',
              )}
            >
              <Icone className={classNames('h-3.5 w-3.5', ativo ? 'text-accent-400' : 'text-ink-muted')} />
              {item.rotulo}
              <span
                className={classNames(
                  'ml-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                  ativo ? 'bg-white/15 text-white' : 'bg-paper-deep text-ink-muted',
                )}
              >
                {item.contagem}
              </span>
            </button>
          );
        })}
      </div>

      {aba === 'trabalhos' && (
        <WorksPanel
          onNovo={abrirNovoTrabalho}
          onEditar={abrirEditarTrabalho}
          onExcluir={setTrabalhoParaExcluir}
          onImportar={() => arquivoRef.current?.click()}
          onExportar={exportarTrabalhos}
          onModelo={baixarModelo}
        />
      )}
      {aba === 'membros' && (
        <MembersPanel
          onNovo={abrirNovoMembro}
          onEditar={abrirEditarMembro}
          onExcluir={setMembroParaExcluir}
        />
      )}
      {aba === 'distribuicao' && <DistributionMatrix onEditarTrabalho={abrirEditarTrabalho} />}

      <input
        ref={arquivoRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          e.target.value = '';
          if (arquivo) void processarImportacao(arquivo);
        }}
      />

      {importando && (
        <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-2xl bg-brand-900 px-4 py-3 text-[12px] font-semibold text-white shadow-float">
          <Upload className="h-4 w-4 animate-pulse text-accent-400" />
          Importando CSV…
        </div>
      )}

      {modo === 'demo' && (
        <section className="mt-8 rounded-2xl border border-rose-500/20 bg-rose-100/30 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-rose-600" />
                <h2 className="font-serif text-[16px] font-semibold text-ink">Zona de demonstração</h2>
                <Badge tom="rose">dados locais</Badge>
              </div>
              <p className="mt-1 max-w-2xl text-[10.5px] leading-relaxed text-ink-muted">
                Apaga as alterações salvas neste navegador e restaura os 20 trabalhos e 3 membros de
                exemplo. Não afeta o Supabase.
              </p>
            </div>
            <Button
              variante="danger"
              tamanho="sm"
              onClick={() => void reiniciarDemo()}
              carregando={resetando}
            >
              Reiniciar demonstração
            </Button>
          </div>
        </section>
      )}

      <TrabalhoModal
        aberto={trabalhoModal}
        trabalho={trabalhoEditando}
        onFechar={() => setTrabalhoModal(false)}
      />
      <MembroModal
        aberto={membroModal}
        membro={membroEditando}
        onFechar={() => setMembroModal(false)}
      />

      <Modal
        aberto={Boolean(trabalhoParaExcluir)}
        onFechar={() => setTrabalhoParaExcluir(null)}
        titulo={`Excluir trabalho ${trabalhoParaExcluir?.codigo ?? ''}?`}
        descricao="Esta ação não pode ser desfeita."
        largura="sm"
        rodape={
          <>
            <Button variante="ghost" onClick={() => setTrabalhoParaExcluir(null)}>
              Cancelar
            </Button>
            <Button variante="danger" onClick={() => void confirmarExclusaoTrabalho()} carregando={excluindo}>
              Excluir trabalho
            </Button>
          </>
        }
      >
        <p className="text-[12px] leading-relaxed text-ink-soft">
          <strong className="text-ink">{trabalhoParaExcluir?.titulo}</strong>
        </p>
        <p className="mt-2 text-[11.5px] leading-relaxed text-ink-muted">
          Isso remove {contar(atribuicoesDoTrabalho, 'atribuição', 'atribuições')} e{' '}
          {contar(avaliacoesDoTrabalho, 'avaliação', 'avaliações')} vinculadas a este trabalho.
          Se quiser apenas corrigir dados, use{' '}
          <strong className="text-ink-soft">Editar</strong>.
        </p>
      </Modal>

      <Modal
        aberto={Boolean(membroParaExcluir)}
        onFechar={() => setMembroParaExcluir(null)}
        titulo={`Excluir ${membroParaExcluir?.nome ?? 'membro'}?`}
        descricao="Esta ação não pode ser desfeita."
        largura="sm"
        rodape={
          <>
            <Button variante="ghost" onClick={() => setMembroParaExcluir(null)}>
              Cancelar
            </Button>
            <Button variante="danger" onClick={() => void confirmarExclusaoMembro()} carregando={excluindo}>
              Excluir membro
            </Button>
          </>
        }
      >
        <p className="text-[11.5px] leading-relaxed text-ink-muted">
          Isso remove {contar(atribuicoesDoMembro, 'atribuição', 'atribuições')} e{' '}
          {contar(avaliacoesDoMembro, 'avaliação', 'avaliações')} deste membro. O histórico de
          notas dele(a) deixa de compor o ranking.
        </p>
        <div className="mt-2 flex items-start gap-2 rounded-xl border border-accent-200 bg-accent-50 px-3 py-2 text-[10.5px] leading-relaxed text-accent-700">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Se a pessoa apenas saiu da banca, prefira desativá-la em <strong>Editar</strong>: o
          histórico é preservado.
        </div>
      </Modal>

      <Modal
        aberto={importResultado !== null}
        onFechar={() => setImportResultado(null)}
        titulo="Resultado da importação"
        descricao="Trabalhos válidos são salvos; códigos existentes são atualizados."
        largura="md"
        rodape={
          <>
            <Button variante="secondary" onClick={baixarModelo}>
              Baixar modelo
            </Button>
            <Button variante="dark" onClick={() => setImportResultado(null)}>
              Fechar
            </Button>
          </>
        }
      >
        {importResultado && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <MiniStat
                rotulo="Válidos"
                valor={importResultado.trabalhos.length}
                tom="green"
                icone={<CheckCircle2 className="h-4 w-4" />}
              />
              <MiniStat
                rotulo="Erros"
                valor={importResultado.erros.length}
                tom={importResultado.erros.length > 0 ? 'rose' : 'neutral'}
                icone={<FileWarning className="h-4 w-4" />}
              />
              <MiniStat
                rotulo="Avisos"
                valor={importResultado.avisos.length}
                tom={importResultado.avisos.length > 0 ? 'amber' : 'neutral'}
                icone={<Info className="h-4 w-4" />}
              />
            </div>

            {importResultado.trabalhos.length > 0 && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-50 px-3.5 py-2.5 text-[11px] leading-relaxed text-emerald-800">
                {contar(importResultado.trabalhos.length, 'trabalho importado', 'trabalhos importados')} com sucesso. Se o arquivo
                tiver linhas com erro, corrija o CSV e importe novamente: os códigos válidos serão
                atualizados, não duplicados.
              </div>
            )}

            {importResultado.erros.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-rose-600">
                  Linhas com erro
                </h4>
                <ul className="scrollbar-thin mt-1.5 max-h-32 space-y-1 overflow-y-auto rounded-xl border border-line-soft bg-paper-light p-2.5 text-[10.5px] leading-relaxed text-ink-soft">
                  {importResultado.erros.slice(0, 20).map((erro) => (
                    <li key={erro} className="flex gap-1.5">
                      <span className="text-rose-500">•</span> {erro}
                    </li>
                  ))}
                </ul>
                {importResultado.erros.length > 20 && (
                  <p className="mt-1 text-[9.5px] text-ink-muted">
                    … e mais {contar(importResultado.erros.length - 20, 'erro', 'erros')}.
                  </p>
                )}
              </div>
            )}

            {importResultado.avisos.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent-700">
                  Avisos
                </h4>
                <ul className="scrollbar-thin mt-1.5 max-h-28 space-y-1 overflow-y-auto rounded-xl border border-line-soft bg-paper-light p-2.5 text-[10.5px] leading-relaxed text-ink-soft">
                  {importResultado.avisos.slice(0, 20).map((aviso) => (
                    <li key={aviso} className="flex gap-1.5">
                      <span className="text-accent-500">•</span> {aviso}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {importResultado.trabalhos.length === 0 && importResultado.erros.length === 0 && (
              <p className="text-[11.5px] text-ink-muted">
                Nenhum registro foi encontrado no arquivo. Confira se o CSV tem cabeçalho e ao menos
                uma linha de dados.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Passo({
  numero,
  titulo,
  texto,
  ativo,
}: {
  numero: string;
  titulo: string;
  texto: string;
  ativo: boolean;
}) {
  return (
    <div
      className={classNames(
        'rounded-2xl border px-3.5 py-2.5 transition',
        ativo ? 'border-brand-300 bg-brand-50/70' : 'border-line-soft bg-white/60',
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={classNames(
            'flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold',
            ativo ? 'bg-brand-800 text-white' : 'bg-paper-deep text-ink-muted',
          )}
        >
          {numero}
        </span>
        <span className="text-[11px] font-semibold text-ink">{titulo}</span>
      </div>
      <p className="mt-1 text-[9.5px] leading-snug text-ink-muted">{texto}</p>
    </div>
  );
}

function MiniStat({
  rotulo,
  valor,
  tom,
  icone,
}: {
  rotulo: string;
  valor: number;
  tom: 'green' | 'rose' | 'amber' | 'neutral';
  icone: ReactNode;
}) {
  const tons: Record<'green' | 'rose' | 'amber' | 'neutral', string> = {
    green: 'border-emerald-500/20 bg-emerald-50 text-emerald-700',
    rose: 'border-rose-500/20 bg-rose-100/70 text-rose-600',
    amber: 'border-accent-200 bg-accent-50 text-accent-700',
    neutral: 'border-line bg-paper-light text-ink-muted',
  };
  return (
    <div className={classNames('rounded-xl border px-3 py-2', tons[tom])}>
      <div className="flex items-center gap-1.5 text-[8.5px] font-bold uppercase tracking-[0.1em]">
        {icone}
        {rotulo}
      </div>
      <div className="mt-0.5 text-[18px] font-extrabold leading-none">{valor}</div>
    </div>
  );
}
