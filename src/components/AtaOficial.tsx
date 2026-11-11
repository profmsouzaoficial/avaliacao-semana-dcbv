import type { Membro, RankingItem, ResumoAvaliador } from '../types';
import { CRITERIOS } from '../data/rubric';
import { EVENTO, SESSOES, categoriaPorNumero } from '../data/event';
import { contar, formatarDataHora, formatarDataLonga, formatarNota } from '../lib/format';

export interface DadosAta {
  dataConsolidacao: string;
  observacoes: string;
  ranking: RankingItem[];
  vencedores: Record<number, RankingItem | null>;
  cobertura: {
    total: number;
    comMinimo: number;
    semAvaliacao: number;
    percentual: number;
  };
  resumo: ResumoAvaliador[];
  membros: Membro[];
  presidente: Membro | null;
}

export function AtaOficial({ dados }: { dados: DadosAta }) {
  const { ranking, vencedores, cobertura, resumo, presidente, dataConsolidacao, observacoes } = dados;
  const totalAvaliacoes = ranking.reduce((soma, item) => soma + item.concluidas, 0);
  const avaliados = ranking.filter((item) => item.media !== null);
  const mediaGeral =
    avaliados.length > 0
      ? avaliados.reduce((soma, item) => soma + (item.media ?? 0), 0) / avaliados.length
      : null;
  const elegiveis = ranking.filter((item) => item.elegivelDestaqueFormativo);
  const avaliadores = resumo.filter((r) => r.atribuidas > 0);
  const mencoes = ranking.reduce((soma, item) => soma + item.votosMencao, 0);
  const sessoesSemAvaliacao = SESSOES.filter((s) => !vencedores[s.numero]);
  const dataLonga = formatarDataLonga(dataConsolidacao);

  return (
    <article className="ata-page" data-ata>
      <header className="flex items-start justify-between gap-6 border-b border-[#0b4645] pb-3">
        <div>
          <div className="text-[8.4pt] font-extrabold uppercase tracking-[0.12em] text-[#083838]">
            Universidade Federal de Juiz de Fora
          </div>
          <div className="mt-0.5 text-[7.8pt] leading-snug text-[#4b5a56]">
            Campus Governador Valadares · Departamento de Ciências Básicas da Vida (DCBV)
          </div>
          <div className="mt-0.5 text-[7.4pt] text-[#6f7d78]">
            Comissão Científica da I Semana do DCBV
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="display text-[15pt] font-semibold leading-none text-[#083838]">I Semana do DCBV</div>
          <div className="mt-1 text-[6.8pt] font-bold uppercase tracking-[0.12em] text-[#8f5a10]">
            Bases da Saúde
          </div>
          <div className="text-[6.8pt] text-[#6f7d78]">{EVENTO.datas}</div>
        </div>
      </header>

      <div className="mt-5 text-center">
        <div className="text-[7pt] font-bold uppercase tracking-[0.2em] text-[#6f7d78]">
          Documento de consolidação
        </div>
        <h1 className="mt-1.5 text-[15pt] font-semibold uppercase tracking-[0.045em] text-[#083838]">
          Ata de consolidação da avaliação de pôsteres
        </h1>
        <div className="mt-1 text-[7.6pt] text-[#4b5a56]">
          Ata nº 01/{EVENTO.ano} · Comissão Científica · {EVENTO.nome}
        </div>
      </div>

      <section className="mt-5 text-[8.6pt] leading-[1.5] text-[#263330]">
        <p>
          Aos <strong>{dataLonga}</strong>, a Comissão Científica da {EVENTO.nome}, do Departamento de
          Ciências Básicas da Vida da Universidade Federal de Juiz de Fora — Campus Governador
          Valadares, reuniu-se para consolidar a avaliação dos pôsteres apresentados no evento,
          realizado de {EVENTO.datas}, sob o tema “{EVENTO.subtitulo}”.
        </p>
      </section>

      <section className="mt-3">
        <h2 className="text-[9.2pt] font-semibold text-[#083838]">1. Da metodologia</h2>
        <p className="mt-1 text-[8.4pt] leading-[1.45] text-[#263330]">
          A avaliação foi realizada por pares, com base em cinco critérios formativos, cada um
          pontuado em cinco níveis (0 a 4) e convertido em 0, 5, 10, 15 ou 20 pontos. A nota final
          corresponde à soma dos cinco critérios, totalizando até 100 pontos:
        </p>
        <ol className="mt-1 grid grid-cols-2 gap-x-5 gap-y-0.5 pl-4 text-[7.9pt] leading-[1.4] text-[#263330]">
          {CRITERIOS.map((criterio) => (
            <li key={criterio.id} className="list-decimal">
              {criterio.titulo} <span className="text-[#6f7d78]">(0–20)</span>
            </li>
          ))}
        </ol>
        <p className="mt-1.5 text-[8.1pt] leading-[1.45] text-[#263330]">
          Foram computadas apenas avaliações concluídas. Cada trabalho deveria receber,
          preferencialmente, duas avaliações independentes; hipóteses de divergência são apreciadas
          pela comissão (Regulamento, itens 5.1 a 5.5). A plataforma <em>Bancas DCBV</em> apoiou o
          registro e a consolidação; o barema oficial e a deliberação da comissão prevalecem.
        </p>
      </section>

      <section className="mt-3">
        <h2 className="text-[9.2pt] font-semibold text-[#083838]">2. Da participação e cobertura</h2>
        <div className="mt-1.5 grid grid-cols-4 gap-2">
          <Dado rotulo="Trabalhos cadastrados" valor={String(cobertura.total)} />
          <Dado
            rotulo="Com cobertura mínima"
            valor={`${cobertura.comMinimo} (${formatarNota(cobertura.percentual, 0)}%)`}
          />
          <Dado rotulo="Avaliações concluídas" valor={String(totalAvaliacoes)} />
          <Dado rotulo="Média geral" valor={mediaGeral !== null ? `${formatarNota(mediaGeral, 1)}/100` : '—'} />
        </div>
        <p className="mt-1.5 text-[8.1pt] leading-[1.45] text-[#263330]">
          {cobertura.semAvaliacao > 0
            ? `${contar(cobertura.semAvaliacao, 'trabalho ainda sem avaliação concluída', 'trabalhos ainda sem avaliação concluída')}. `
            : 'Todos os trabalhos cadastrados possuem ao menos uma avaliação concluída. '}
          {avaliadores.length > 0
            ? `Participaram da avaliação ${contar(avaliadores.length, 'membro', 'membros')}: ${avaliadores
                .map((r) => r.membro.nome)
                .join('; ')}.`
            : 'Não houve avaliação registrada.'}{' '}
          {mencoes > 0 && `${contar(mencoes, 'indicação', 'indicações')} de menção honrosa ${mencoes === 1 ? 'foi registrada' : 'foram registradas'}.`}
        </p>
      </section>

      <section className="mt-3">
        <h2 className="text-[9.2pt] font-semibold text-[#083838]">
          3. Dos resultados por sessão temática
        </h2>
        <p className="mt-1 text-[8.1pt] leading-[1.45] text-[#263330]">
          O quadro abaixo apresenta o trabalho de maior média em cada sessão, apurado entre as
          avaliações concluídas. Em caso de empate, observam-se as médias dos critérios 4, 5, 1, 2 e
          3, nesta ordem; persistindo, a ordem do código do trabalho.
        </p>
        <table className="mt-1.5">
          <thead>
            <tr>
              <th className="w-[8%]">Sessão</th>
              <th className="w-[9%]">Código</th>
              <th>Trabalho</th>
              <th className="w-[9%] text-center">Média</th>
              <th className="w-[9%] text-center">Aval.</th>
            </tr>
          </thead>
          <tbody>
            {SESSOES.map((sessao) => {
              const item = vencedores[sessao.numero];
              return (
                <tr key={sessao.numero}>
                  <td className="font-semibold text-[#083838]">
                    {String(sessao.numero).padStart(2, '0')} · {sessao.curto}
                  </td>
                  <td className="font-mono text-[7.6pt] text-[#4b5a56]">
                    {item?.trabalho.codigo ?? '—'}
                  </td>
                  <td>
                    {item ? (
                      <>
                        <div className="text-[7.9pt] font-medium leading-snug">{item.trabalho.titulo}</div>
                        <div className="text-[6.8pt] text-[#6f7d78]">
                          {categoriaPorNumero(item.trabalho.categoria).curto}
                          {item.votosMencao > 0 ? ` · ${contar(item.votosMencao, 'indicação', 'indicações')}` : ''}
                        </div>
                      </>
                    ) : (
                      <span className="text-[7.6pt] italic text-[#6f7d78]">
                        Sem avaliação concluída nesta sessão.
                      </span>
                    )}
                  </td>
                  <td className="text-center font-semibold">
                    {item?.media !== null && item?.media !== undefined
                      ? formatarNota(item.media, 1)
                      : '—'}
                  </td>
                  <td className="text-center">{item ? `${item.concluidas}/${item.atribuidas}` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="mt-3">
        <h2 className="text-[9.2pt] font-semibold text-[#083838]">4. Das menções honrosas</h2>
        <p className="mt-1 text-[8.2pt] leading-[1.45] text-[#263330]">
          Com fundamento no item 7.2 do Regulamento, a Comissão Científica indica para Menção
          Honrosa, por sessão temática, os trabalhos relacionados no quadro do item 3. A indicação
          acima é uma prévia técnica baseada nas médias; a concessão da menção é deliberação
          soberana da comissão (Regulamento, item 5.5).
          {sessoesSemAvaliacao.length > 0 &&
            ` Permanecem pendentes de deliberação as sessões ${sessoesSemAvaliacao
              .map((s) => String(s.numero).padStart(2, '0'))
              .join(', ')}, sem avaliação concluída até a data desta ata.`}
        </p>
      </section>

      <section className="mt-3">
        <h2 className="text-[9.2pt] font-semibold text-[#083838]">5. Do destaque formativo</h2>
        <p className="mt-1 text-[8.1pt] leading-[1.45] text-[#263330]">
          Como reconhecimento pedagógico, e não como categoria oficial do Regulamento, registra-se a
          sugestão de destaque formativo para estudantes de graduação nos períodos iniciais (1º a 4º)
          que alcançaram média igual ou superior a 15/20 no critério 4 — diálogo entre ciências
          básicas e formação em saúde.
          {elegiveis.length > 0 ? (
            <>
              {' '}
              Trabalhos elegíveis:{' '}
              {elegiveis
                .slice(0, 8)
                .map((item) => `${item.trabalho.codigo} (${item.trabalho.titulo})`)
                .join('; ')}
              {elegiveis.length > 8 ? `; e outros ${contar(elegiveis.length - 8, 'trabalho', 'trabalhos')}.` : '.'}
            </>
          ) : (
            ' Não foram identificados trabalhos elegíveis com os dados disponíveis; o parecer de aprovação não informa período e nível dos autores.'
          )}
        </p>
      </section>

      <section className="mt-3">
        <h2 className="text-[9.2pt] font-semibold text-[#083838]">6. Das observações da comissão</h2>
        <p className="mt-1 whitespace-pre-line text-[8.2pt] leading-[1.45] text-[#263330]">
          {observacoes.trim() ||
            'Não houve observações adicionais registradas. A comissão registra que a consolidação observou os critérios de cobertura e de impessoalidade previstos no Regulamento.'}
        </p>
      </section>

      <section className="mt-3 text-[8.2pt] leading-[1.45] text-[#263330]">
        <p>
          Nada mais havendo a tratar, a presente ata foi lavrada e, após leitura, será assinada pela
          presidência da Comissão Científica.
        </p>
        <p className="mt-2">Governador Valadares, {dataLonga}.</p>
      </section>

      <div className="mt-8 flex justify-center">
        <div className="ata-signature">
          <div className="text-[8.4pt] font-semibold text-[#161c1a]">
            {presidente?.nome ?? 'Presidência da Comissão Científica'}
          </div>
          <div className="text-[7.2pt] text-[#4b5a56]">
            Presidente da Comissão Científica · I Semana do DCBV
          </div>
          {presidente?.instituicao && (
            <div className="text-[6.8pt] text-[#6f7d78]">{presidente.instituicao}</div>
          )}
        </div>
      </div>

      <footer className="mt-6 flex items-end justify-between border-t border-[#dde3e0] pt-2 text-[6.6pt] leading-snug text-[#6f7d78]">
        <span>
          Documento gerado pela plataforma Bancas DCBV em {formatarDataHora(new Date().toISOString())}.
          Minuta de apoio sujeita a revisão e assinatura.
        </span>
        <span className="shrink-0 font-semibold uppercase tracking-[0.12em] text-[#4b5a56]">
          DCBV · UFJF/GV
        </span>
      </footer>
    </article>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded border border-[#dde3e0] bg-[#f8faf9] px-2 py-1.5">
      <div className="text-[6.3pt] font-bold uppercase tracking-[0.08em] text-[#6f7d78]">{rotulo}</div>
      <div className="mt-0.5 text-[10pt] font-semibold leading-none text-[#083838]">{valor}</div>
    </div>
  );
}
