import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileText,
  GraduationCap,
  Info,
  MessageSquareText,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react';
import type { Avaliacao, StatusTrabalho, Trabalho } from '../types';
import { CRITERIOS, calcularNota, nivelPorValor, rotuloNota, totalRespondidos } from '../data/rubric';
import { categoriaPorNumero, sessaoPorNumero } from '../data/event';
import { useApp } from '../context/AppContext';
import { classNames, contar, formatarDataHora, formatarNota } from '../lib/format';
import { mensagemDeErro } from '../lib/supabase';
import { Badge } from './Badge';
import { Button } from './Button';
import { StatusBadge } from './StatusBadge';
import { RubricCriterion } from './RubricCriterion';
import { ScoreOverview } from './ScoreOverview';

interface EvaluationFormProps {
  trabalho: Trabalho;
  onProximo?: () => void;
  temProximo: boolean;
}

interface EstadoFormulario {
  notas: Record<string, number>;
  parecer: string;
  pontosFortes: string;
  sugestoes: string;
  indicacaoMencao: boolean;
  justificativaMencao: string;
}

function estadoInicial(avaliacao?: Avaliacao): EstadoFormulario {
  return {
    notas: avaliacao ? { ...avaliacao.notas } : {},
    parecer: avaliacao?.parecer ?? '',
    pontosFortes: avaliacao?.pontosFortes ?? '',
    sugestoes: avaliacao?.sugestoes ?? '',
    indicacaoMencao: avaliacao?.indicacaoMencao ?? false,
    justificativaMencao: avaliacao?.justificativaMencao ?? '',
  };
}

function serializar(estado: EstadoFormulario): string {
  return JSON.stringify(estado);
}

export function EvaluationForm({ trabalho, onProximo, temProximo }: EvaluationFormProps) {
  const { membro, avaliacoes, salvarAvaliacao, notificar } = useApp();
  const meuId = membro?.id ?? '';
  const existente = avaliacoes.find(
    (a) => a.trabalhoId === trabalho.id && a.avaliadorId === meuId,
  );
  const inicial = useMemo(() => estadoInicial(existente), [existente?.id]);

  const [notas, setNotas] = useState<Record<string, number>>(inicial.notas);
  const [parecer, setParecer] = useState(inicial.parecer);
  const [pontosFortes, setPontosFortes] = useState(inicial.pontosFortes);
  const [sugestoes, setSugestoes] = useState(inicial.sugestoes);
  const [indicacaoMencao, setIndicacaoMencao] = useState(inicial.indicacaoMencao);
  const [justificativaMencao, setJustificativaMencao] = useState(inicial.justificativaMencao);
  const [concluida, setConcluida] = useState(existente?.concluida ?? false);
  const [salvoEm, setSalvoEm] = useState<string | null>(existente?.atualizadoEm ?? null);
  const [abertoId, setAbertoId] = useState<number | null>(() => {
    if (existente?.concluida) return null;
    const primeiro = CRITERIOS.find(
      (c) => !Number.isInteger(Number(inicial.notas[String(c.id)])),
    );
    return primeiro?.id ?? CRITERIOS[0].id;
  });
  const [mostrarResumo, setMostrarResumo] = useState(false);
  const [salvandoTipo, setSalvandoTipo] = useState<'rascunho' | 'concluir' | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [baseline, setBaseline] = useState(() => serializar(inicial));

  const estadoAtual: EstadoFormulario = {
    notas,
    parecer,
    pontosFortes,
    sugestoes,
    indicacaoMencao,
    justificativaMencao,
  };
  const atualSerializado = serializar(estadoAtual);
  const dirty = atualSerializado !== baseline;
  const respondidos = totalRespondidos(notas);
  const notaFinal = calcularNota(notas);
  const completa = respondidos === CRITERIOS.length;
  const mencaoValida = !indicacaoMencao || justificativaMencao.trim().length >= 20;
  const podeConcluir = completa && mencaoValida;
  const temConteudo =
    respondidos > 0 ||
    parecer.trim().length > 0 ||
    pontosFortes.trim().length > 0 ||
    sugestoes.trim().length > 0 ||
    indicacaoMencao;

  const sessao = sessaoPorNumero(trabalho.sessao);
  const categoria = categoriaPorNumero(trabalho.categoria);

  const statusAtual: StatusTrabalho['status'] = concluida
    ? 'concluida'
    : existente || dirty || temConteudo
      ? 'rascunho'
      : 'pendente';

  useEffect(() => {
    if (!dirty) return;
    const aoSair = (evento: BeforeUnloadEvent) => {
      evento.preventDefault();
      evento.returnValue = '';
    };
    window.addEventListener('beforeunload', aoSair);
    return () => window.removeEventListener('beforeunload', aoSair);
  }, [dirty]);

  const montarAvaliacao = (concluir: boolean): Avaliacao => {
    const notasValidas: Record<string, number> = {};
    CRITERIOS.forEach((criterio) => {
      const valor = Number(notas[String(criterio.id)]);
      if (Number.isInteger(valor) && valor >= 0 && valor <= 4) {
        notasValidas[String(criterio.id)] = valor;
      }
    });
    return {
      id: `${trabalho.id}:${meuId}`,
      trabalhoId: trabalho.id,
      avaliadorId: meuId,
      notas: notasValidas,
      notaFinal: calcularNota(notasValidas),
      parecer: parecer.trim(),
      pontosFortes: pontosFortes.trim(),
      sugestoes: sugestoes.trim(),
      indicacaoMencao,
      justificativaMencao: justificativaMencao.trim(),
      concluida: concluir,
      atualizadoEm: new Date().toISOString(),
    };
  };

  const salvar = async (concluir: boolean) => {
    if (!membro || salvandoTipo) return;
    setErro(null);
    if (concluir) {
      if (!completa) {
        const faltante = CRITERIOS.find(
          (c) => !Number.isInteger(Number(notas[String(c.id)])),
        );
        setErro(
          `Responda aos cinco critérios antes de concluir. ${contar(CRITERIOS.length - respondidos, 'critério pendente', 'critérios pendentes')}.`,
        );
        if (faltante) {
          setAbertoId(faltante.id);
          window.setTimeout(() => {
            document.getElementById(`criterio-${faltante.id}`)?.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }, 80);
        }
        return;
      }
      if (!mencaoValida) {
        setErro('Para indicar menção honrosa, escreva uma justificativa com pelo menos 20 caracteres.');
        return;
      }
    } else if (!temConteudo) {
      return;
    }

    setSalvandoTipo(concluir ? 'concluir' : 'rascunho');
    try {
      const salva = await salvarAvaliacao(montarAvaliacao(concluir));
      setConcluida(salva.concluida);
      setSalvoEm(salva.atualizadoEm);
      setBaseline(atualSerializado);
      if (concluir) {
        notificar('Avaliação concluída. Obrigado pelo cuidado com o feedback.', 'sucesso');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        notificar('Rascunho salvo. Você pode continuar depois.', 'sucesso');
      }
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setSalvandoTipo(null);
    }
  };

  const reabrir = async () => {
    if (!membro || salvandoTipo) return;
    const confirmado = window.confirm(
      'Reabrir esta avaliação? As notas e o feedback serão mantidos, mas o trabalho voltará a aparecer como rascunho até você concluir novamente.',
    );
    if (!confirmado) return;
    setSalvandoTipo('rascunho');
    setErro(null);
    try {
      const salva = await salvarAvaliacao(montarAvaliacao(false));
      setConcluida(false);
      setSalvoEm(salva.atualizadoEm);
      setBaseline(atualSerializado);
      setAbertoId(CRITERIOS[0].id);
      notificar('Avaliação reaberta para edição.', 'info');
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setSalvandoTipo(null);
    }
  };

  if (!membro) return null;

  return (
    <div>
      <header className="mb-5">
        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-ink-muted">
          <span>Minhas avaliações</span>
          <ChevronDown className="h-3 w-3 -rotate-90" />
          <span>{sessao.curto}</span>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-brand-900 px-2.5 py-1 font-mono text-[11px] font-bold tracking-wide text-white">
            {trabalho.codigo}
          </span>
          <Badge tom="brand">{sessao.nome}</Badge>
          <Badge tom="neutral">{categoria.curto}</Badge>
          <StatusBadge status={statusAtual} />
          {salvoEm && (
            <span className="text-[10px] text-ink-muted">Salvo em {formatarDataHora(salvoEm)}</span>
          )}
        </div>
        <h1 className="display mt-3 max-w-4xl text-[25px] font-semibold leading-[1.12] tracking-tight text-ink sm:text-[31px]">
          {trabalho.titulo}
        </h1>

        <div className="mt-4 grid gap-3 rounded-2xl border border-line-soft bg-white/70 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <FichaItem
            icone={<UserRound className="h-3.5 w-3.5" />}
            rotulo="Apresentação"
            valor={trabalho.apresentador || 'A informar'}
          />
          <FichaItem
            icone={<Users className="h-3.5 w-3.5" />}
            rotulo="Autoria"
            valor={trabalho.autores || 'A informar'}
          />
          <FichaItem
            icone={<Building2 className="h-3.5 w-3.5" />}
            rotulo="Instituição"
            valor={trabalho.instituicao || 'A informar'}
          />
          <FichaItem
            icone={<GraduationCap className="h-3.5 w-3.5" />}
            rotulo="Nível / período"
            valor={rotuloNivel(trabalho)}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {trabalho.resumo ? (
            <button
              type="button"
              onClick={() => setMostrarResumo((v) => !v)}
              className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-brand-700 transition hover:text-brand-900"
            >
              <FileText className="h-3.5 w-3.5" />
              {mostrarResumo ? 'Ocultar resumo' : 'Ler resumo'}
              <ChevronDown className={classNames('h-3.5 w-3.5 transition', mostrarResumo && 'rotate-180')} />
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-muted">
              <Info className="h-3.5 w-3.5" />
              Resumo não informado no parecer. Avalie o banner e a apresentação.
            </span>
          )}
          {trabalho.linkPdf && (
            <a
              href={trabalho.linkPdf}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-brand-700 hover:text-brand-900"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir PDF do trabalho
            </a>
          )}
        </div>
        {mostrarResumo && trabalho.resumo && (
          <div className="mt-3 whitespace-pre-line rounded-2xl border border-line-soft bg-paper-light p-4 text-[12.5px] leading-relaxed text-ink-soft animate-fade">
            {trabalho.resumo}
          </div>
        )}
      </header>

      {concluida ? (
        <ResumoConcluido
          notas={notas}
          notaFinal={notaFinal}
          salvoEm={salvoEm}
          parecer={parecer}
          pontosFortes={pontosFortes}
          sugestoes={sugestoes}
          indicacaoMencao={indicacaoMencao}
          justificativaMencao={justificativaMencao}
          salvando={salvandoTipo !== null}
          onReabrir={() => void reabrir()}
          onProximo={onProximo}
          temProximo={temProximo}
        />
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="order-2 min-w-0 xl:order-1">
              <div className="card mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">
                      Régua de avaliação
                    </div>
                    <div className="text-[12.5px] font-semibold text-ink">Cinco decisões, 100 pontos</div>
                  </div>
                </div>
                <p className="max-w-xl text-[11.5px] leading-relaxed text-ink-muted">
                  Marque um nível por critério. Use os descritores como régua e escreva um feedback
                  que ajude o estudante a melhorar.
                </p>
                <div className="ml-auto flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-paper-deep">
                    <div
                      className="h-full rounded-full bg-brand-600 transition-all duration-300"
                      style={{ width: `${(respondidos / CRITERIOS.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10.5px] font-bold text-ink-soft">{respondidos}/5</span>
                </div>
              </div>

              <div className="space-y-3">
                {CRITERIOS.map((criterio) => (
                  <RubricCriterion
                    key={criterio.id}
                    criterio={criterio}
                    valor={notas[String(criterio.id)]}
                    categoria={trabalho.categoria}
                    aberto={abertoId === criterio.id}
                    onAlternar={() => setAbertoId((atual) => (atual === criterio.id ? null : criterio.id))}
                    onSelecionar={(valor) => {
                      setNotas((atuais) => ({ ...atuais, [String(criterio.id)]: valor }));
                      setErro(null);
                    }}
                  />
                ))}
              </div>

              {completa && (
                <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] leading-relaxed text-emerald-800">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p>
                    Todos os critérios foram respondidos. Revise o feedback abaixo e clique em{' '}
                    <strong>Concluir avaliação</strong>.
                  </p>
                </div>
              )}

              <section className="card mt-5 overflow-hidden">
                <div className="border-b border-line-soft bg-white px-4 py-4 sm:px-5">
                  <div className="flex items-center gap-2">
                    <MessageSquareText className="h-4 w-4 text-brand-600" />
                    <h2 className="font-serif text-[18px] font-semibold text-ink">Feedback formativo</h2>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-ink-muted">
                    Estes campos são opcionais, mas fazem diferença. Seja específico, acionável e
                    respeitoso — o estudante está aprendendo a comunicar ciência.
                  </p>
                </div>
                <div className="space-y-4 px-4 py-4 sm:px-5">
                  <CampoTexto
                    rotulo="Pontos fortes"
                    dica="O que o trabalho já faz bem e deve ser preservado."
                    valor={pontosFortes}
                    onChange={setPontosFortes}
                    placeholder="Ex.: O objetivo está claro e a figura 2 explica o método sem depender do texto."
                    icone={<CheckCircle2 className="h-3.5 w-3.5" />}
                  />
                  <CampoTexto
                    rotulo="Sugestões de melhoria"
                    dica="Uma ou duas ações concretas valem mais do que uma lista longa."
                    valor={sugestoes}
                    onChange={setSugestoes}
                    placeholder="Ex.: Informar o número de participantes e o período da coleta; revisar a legenda da figura."
                    icone={<ArrowRight className="h-3.5 w-3.5" />}
                  />
                  <CampoTexto
                    rotulo="Parecer para a comissão"
                    dica="Opcional. Observações internas sobre escopo, ética ou elegibilidade."
                    valor={parecer}
                    onChange={setParecer}
                    placeholder="Opcional. Ex.: Trabalho adequado à categoria, com resultados parciais bem descritos."
                    icone={<FileText className="h-3.5 w-3.5" />}
                    interno
                  />
                  <details className="rounded-2xl bg-paper-light px-4 py-3">
                    <summary className="cursor-pointer text-[11px] font-semibold text-brand-700">
                      Como escrever um feedback útil
                    </summary>
                    <ul className="mt-2 space-y-1.5 pl-4 text-[11.5px] leading-relaxed text-ink-muted">
                      <li className="list-disc">Aponte o que está no pôster, não a pessoa.</li>
                      <li className="list-disc">Diga o que melhorar e como, em uma frase acionável.</li>
                      <li className="list-disc">Reconheça o esforço e o que já funciona.</li>
                      <li className="list-disc">Evite jargão que o estudante ainda não domina.</li>
                    </ul>
                  </details>
                </div>
              </section>

              <section className="card mt-4 overflow-hidden">
                <div className="px-4 py-4 sm:px-5">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={indicacaoMencao}
                      onChange={(e) => {
                        setIndicacaoMencao(e.target.checked);
                        setErro(null);
                      }}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-brand-700"
                    />
                    <span>
                      <span className="flex items-center gap-1.5 font-serif text-[16px] font-semibold text-ink">
                        <Award className="h-4 w-4 text-accent-500" />
                        Indicar para menção honrosa
                      </span>
                      <span className="mt-1 block text-[11.5px] leading-relaxed text-ink-muted">
                        A indicação é um voto do avaliador. A Comissão Científica delibera sobre a
                        menção ao final (Regulamento, item 7.2). Indique trabalhos que se destacaram
                        no conjunto — não apenas pela nota.
                      </span>
                    </span>
                  </label>

                  {indicacaoMencao && (
                    <div className="mt-3 pl-7 animate-fade">
                      <label className="block">
                        <span className="mb-1.5 flex items-center justify-between gap-3">
                          <span className="text-[11.5px] font-semibold text-ink-soft">
                            Por que este trabalho merece a menção?
                          </span>
                          <span
                            className={classNames(
                              'text-[10px] font-semibold',
                              justificativaMencao.trim().length >= 20
                                ? 'text-emerald-600'
                                : 'text-ink-muted',
                            )}
                          >
                            {justificativaMencao.trim().length}/20 mín.
                          </span>
                        </span>
                        <textarea
                          value={justificativaMencao}
                          onChange={(e) => setJustificativaMencao(e.target.value)}
                          rows={3}
                          placeholder="Ex.: O trabalho conecta a fisiologia da coagulação a um problema real de saúde e a apresentação foi clara e segura."
                          className="w-full resize-y rounded-xl border border-line bg-paper-light px-3 py-2.5 text-[12.5px] leading-relaxed text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="order-1 xl:order-2 xl:sticky xl:top-[88px] xl:self-start">
              <ScoreOverview
                notas={notas}
                notaFinal={notaFinal}
                respondidos={respondidos}
                concluida={concluida}
              />
              <div className="mt-3 rounded-2xl border border-line-soft bg-white/70 px-4 py-3">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
                  <p className="text-[10.5px] leading-relaxed text-ink-muted">
                    A nota é calculada automaticamente e fica visível para a comissão. O feedback
                    também pode ser compartilhado com o estudante após o evento.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-3 z-20 mt-6 rounded-2xl border border-line bg-white/95 p-3 shadow-float backdrop-blur-md sm:p-4">
            {erro && (
              <div className="mb-2.5 rounded-xl border border-rose-500/20 bg-rose-100/70 px-3 py-2 text-[11.5px] leading-relaxed text-rose-600">
                {erro}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-brand-950 text-white">
                  <span className="text-[15px] font-extrabold leading-none">
                    {formatarNota(notaFinal, Number.isInteger(notaFinal) ? 0 : 1)}
                  </span>
                  <span className="text-[7px] font-bold uppercase tracking-[0.12em] text-brand-300">/100</span>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                    {completa ? 'Nota final' : 'Nota parcial'}
                  </div>
                  <div className="text-[12px] font-medium text-ink-soft">
                    {respondidos}/5 critérios
                    {dirty && <span className="ml-1.5 text-accent-600">· não salvo</span>}
                  </div>
                </div>
              </div>
              <div className="ml-auto flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <Button
                  variante="secondary"
                  onClick={() => void salvar(false)}
                  disabled={!temConteudo || salvandoTipo !== null}
                  carregando={salvandoTipo === 'rascunho'}
                  icone={<Save className="h-4 w-4" />}
                  className="flex-1 sm:flex-none"
                >
                  Salvar rascunho
                </Button>
                <Button
                  variante="amber"
                  onClick={() => void salvar(true)}
                  disabled={!podeConcluir || salvandoTipo !== null}
                  carregando={salvandoTipo === 'concluir'}
                  icone={<Send className="h-4 w-4" />}
                  className="flex-1 sm:flex-none"
                  title={!completa ? `Faltam ${contar(CRITERIOS.length - respondidos, 'critério', 'critérios')}` : undefined}
                >
                  Concluir avaliação
                </Button>
              </div>
            </div>
            {!completa && (
              <p className="mt-2 text-[10.5px] text-ink-muted">
                Faltam {contar(CRITERIOS.length - respondidos, 'critério', 'critérios')} para liberar a conclusão.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function FichaItem({ icone, rotulo, valor }: { icone: ReactNode; rotulo: string; valor: string }) {
  const vazio = valor === 'A informar';
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {icone}
      </span>
      <div className="min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-[0.13em] text-ink-muted">{rotulo}</div>
        <div
          className={classNames(
            'mt-0.5 truncate text-[11.5px] font-medium',
            vazio ? 'italic text-ink-muted' : 'text-ink',
          )}
          title={valor}
        >
          {valor}
        </div>
      </div>
    </div>
  );
}

function rotuloNivel(trabalho: Trabalho): string {
  if (trabalho.nivel === 'graduacao') {
    return trabalho.periodo ? `Graduação · ${trabalho.periodo}` : 'Graduação';
  }
  if (trabalho.nivel === 'pos-graduacao') return 'Pós-graduação';
  if (trabalho.nivel === 'docente') return 'Docência';
  return 'A informar';
}

function CampoTexto({
  rotulo,
  dica,
  valor,
  onChange,
  placeholder,
  icone,
  interno,
}: {
  rotulo: string;
  dica: string;
  valor: string;
  onChange: (valor: string) => void;
  placeholder: string;
  icone: ReactNode;
  interno?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-soft">
          <span className="text-brand-600">{icone}</span>
          {rotulo}
        </span>
        {interno && <Badge tom="neutral">interno</Badge>}
        <span className="text-[10px] text-ink-muted">{dica}</span>
      </span>
      <textarea
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        maxLength={4000}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-line bg-paper-light px-3 py-2.5 text-[12.5px] leading-relaxed text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
      />
      <span className="mt-1 block text-right text-[9.5px] text-ink-muted">{valor.length}/4000</span>
    </label>
  );
}

function ResumoConcluido({
  notas,
  notaFinal,
  salvoEm,
  parecer,
  pontosFortes,
  sugestoes,
  indicacaoMencao,
  justificativaMencao,
  salvando,
  onReabrir,
  onProximo,
  temProximo,
}: {
  notas: Record<string, number>;
  notaFinal: number;
  salvoEm: string | null;
  parecer: string;
  pontosFortes: string;
  sugestoes: string;
  indicacaoMencao: boolean;
  justificativaMencao: string;
  salvando: boolean;
  onReabrir: () => void;
  onProximo?: () => void;
  temProximo: boolean;
}) {
  return (
    <div className="animate-rise">
      <div className="card overflow-hidden border-emerald-200">
        <div className="flex flex-wrap items-center gap-3 border-b border-emerald-200 bg-emerald-50 px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-serif text-[18px] font-semibold text-emerald-900">Avaliação concluída</p>
            <p className="text-[11px] text-emerald-700">
              {salvoEm ? `Salva em ${formatarDataHora(salvoEm)}` : 'Registrada com sucesso'} · visível para a comissão
            </p>
          </div>
          <Badge tom="green">Nota {formatarNota(notaFinal)}/100</Badge>
        </div>

        <div className="grid gap-6 px-5 py-5 lg:grid-cols-[190px_minmax(0,1fr)]">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-brand-950 px-4 py-6 text-white">
            <span className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-brand-300">
              Nota final
            </span>
            <span className="display mt-1 text-[52px] font-semibold leading-none">
              {formatarNota(notaFinal, Number.isInteger(notaFinal) ? 0 : 1)}
            </span>
            <span className="text-[11px] text-brand-300">de 100</span>
            <span className="mt-3 rounded-full bg-accent-400 px-2.5 py-1 text-[10px] font-bold text-brand-950">
              {rotuloNota(notaFinal)}
            </span>
          </div>
          <div className="space-y-3">
            {CRITERIOS.map((criterio) => {
              const valor = Number(notas[String(criterio.id)]);
              const nivel = nivelPorValor(criterio, valor);
              return (
                <div key={criterio.id}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11.5px] font-medium text-ink-soft">{criterio.titulo}</span>
                    <span className="shrink-0 text-[10.5px] font-semibold text-ink">
                      {nivel ? `${nivel.rotulo} · ${nivel.pontos}/20` : '—'}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-deep">
                    <div
                      className={classNames(
                        'h-full rounded-full',
                        valor === 4 ? 'bg-accent-500' : 'bg-brand-600',
                      )}
                      style={{ width: `${(valor / 4) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 border-t border-line-soft px-5 py-5 md:grid-cols-3">
          <BlocoFeedback titulo="Pontos fortes" texto={pontosFortes} />
          <BlocoFeedback titulo="Sugestões" texto={sugestoes} />
          <BlocoFeedback titulo="Parecer interno" texto={parecer} />
        </div>

        <div className="border-t border-line-soft px-5 py-4">
          <div
            className={classNames(
              'flex items-start gap-3 rounded-2xl border px-4 py-3',
              indicacaoMencao
                ? 'border-accent-200 bg-accent-50'
                : 'border-line bg-paper-light',
            )}
          >
            <Award className={classNames('mt-0.5 h-4 w-4 shrink-0', indicacaoMencao ? 'text-accent-600' : 'text-ink-muted')} />
            <div>
              <p className="text-[11.5px] font-semibold text-ink">
                {indicacaoMencao ? 'Indicado para menção honrosa' : 'Não indicado para menção honrosa'}
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
                {indicacaoMencao
                  ? justificativaMencao || 'Sem justificativa registrada.'
                  : 'A ausência de indicação não impede que a comissão considere o trabalho.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line-soft bg-white px-5 py-4">
          <Button
            variante="secondary"
            onClick={onReabrir}
            carregando={salvando}
            icone={<RotateCcw className="h-4 w-4" />}
          >
            Reabrir avaliação
          </Button>
          {temProximo && onProximo ? (
            <Button onClick={onProximo} icone={<ArrowRight className="h-4 w-4" />} className="ml-auto">
              Próximo trabalho
            </Button>
          ) : (
            <p className="ml-auto text-[11px] font-medium text-ink-muted">
              Todas as avaliações atribuídas foram concluídas.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function BlocoFeedback({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-2xl bg-paper-light px-4 py-3">
      <div className="text-[9.5px] font-bold uppercase tracking-[0.13em] text-ink-muted">{titulo}</div>
      <p
        className={classNames(
          'mt-1.5 whitespace-pre-line text-[12px] leading-relaxed',
          texto ? 'text-ink-soft' : 'italic text-ink-muted',
        )}
      >
        {texto || 'Não informado.'}
      </p>
    </div>
  );
}
