import { type ReactNode } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  ExternalLink,
  FileText,
  GraduationCap,
  Info,
  Layers,
  MapPin,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { APLICACAO, CATEGORIAS, EVENTO, SESSOES } from '../data/event';
import { CRITERIOS as RUBRICA } from '../data/rubric';
import { Badge } from './Badge';

export function RegulamentoView() {
  return (
    <div>
      <div className="hero-mesh relative overflow-hidden rounded-3xl px-5 py-6 text-white sm:px-8 sm:py-8">
        <div className="hero-grid absolute inset-0 opacity-60" />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[9.5px] font-bold uppercase tracking-[0.16em] text-brand-100">
            <BookOpen className="h-3 w-3 text-accent-400" />
            Guia da avaliação
          </div>
          <h1 className="display mt-3 text-[31px] font-semibold leading-[1.05] tracking-tight sm:text-[42px]">
            Como avaliamos um banner
          </h1>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-brand-200 sm:text-[13.5px]">
            Um guia honesto para quem está começando: o que observamos, o que cada nível significa e
            por que trocamos quinze cliques rápidos por cinco decisões explícitas.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tom="amber">instrumento pedagógico</Badge>
            <Badge tom="neutral" className="border-white/20 bg-white/10 text-white">
              {APLICACAO.nome} v{APLICACAO.versao}
            </Badge>
            <Badge tom="neutral" className="border-white/20 bg-white/10 text-white">
              I Semana do DCBV · 2026
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Ficha icone={<CalendarDays className="h-4 w-4" />} rotulo="Quando" valor={EVENTO.datas} detalhe="Avaliação presencial dos pôsteres" />
        <Ficha icone={<MapPin className="h-4 w-4" />} rotulo="Onde" valor="Campus GV — UFJF" detalhe={EVENTO.cidade} />
        <Ficha icone={<Users className="h-4 w-4" />} rotulo="Quem avalia" valor="Doutores convidados" detalhe="Duas avaliações por trabalho" />
        <Ficha icone={<Target className="h-4 w-4" />} rotulo="Nota" valor="0 a 100" detalhe="5 critérios × 20 pontos" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <div className="eyebrow">Nesta página</div>
            <nav className="mt-2 space-y-0.5">
              {[
                ['#adaptacao', 'Por que cinco critérios'],
                ['#criterios', 'Os cinco critérios'],
                ['#niveis', 'O que cada nível significa'],
                ['#sessoes', 'Sessões e categorias'],
                ['#cobertura', 'Cobertura e deliberação'],
                ['#links', 'Documentos oficiais'],
              ].map(([href, rotulo]) => (
                <a
                  key={href}
                  href={href}
                  className="block rounded-lg px-2.5 py-1.5 text-[11px] text-ink-muted transition hover:bg-white hover:text-brand-800"
                >
                  {rotulo}
                </a>
              ))}
            </nav>
            <div className="mt-4 rounded-2xl border border-accent-200 bg-accent-50 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-accent-700">
                <Info className="h-3 w-3" /> Lembrete
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-accent-700">
                {APLICACAO.aviso}
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          <section id="adaptacao" className="card scroll-mt-24 px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow">Adaptação honesta</span>
              <Badge tom="brand">graduação</Badge>
            </div>
            <h2 className="display mt-1.5 text-[24px] font-semibold text-ink">
              Por que cinco critérios, e não quinze
            </h2>
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
              O modelo que inspirou este app foi desenhado para um prêmio de mestrado: quinze itens
              de escala Likert, somando 75 pontos, mais uma nota livre de 25 pontos atribuída pelo
              professor. Para um estudante do primeiro ou segundo período, esse desenho mede mais a
              familiaridade com o jargão acadêmico do que a qualidade do que ele conseguiu fazer.
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
              Aqui, cada avaliador toma <strong className="text-ink">cinco decisões explícitas</strong>,
              com descritores observáveis. Cada decisão vale até 20 pontos; a soma fecha 100. A
              pergunta de fundo não é “este trabalho é digno de um congresso internacional?”, mas
              “o que este estudante conseguiu comunicar com o repertório que tem?”.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-paper-light p-3.5">
                <div className="text-[9px] font-bold uppercase tracking-[0.13em] text-ink-muted">
                  O que evitamos
                </div>
                <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-ink-soft">
                  <li>• Nota livre do professor, que mistura impressão geral com critério.</li>
                  <li>• Quinze itens que viram quinze cliques rápidos no corredor.</li>
                  <li>• Comparar um relato de caso com um ensaio clínico como se fossem iguais.</li>
                  <li>• Transformar “resultados parciais” em defeito.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-brand-200 bg-brand-50 p-3.5">
                <div className="text-[9px] font-bold uppercase tracking-[0.13em] text-brand-700">
                  O que priorizamos
                </div>
                <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-brand-900">
                  <li>• Clareza do pôster e do que foi feito.</li>
                  <li>• Coerência entre pergunta, método e categoria escolhida.</li>
                  <li>• Diálogo entre ciência básica e formação em saúde.</li>
                  <li>• Honestidade sobre limites e próximos passos.</li>
                </ul>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-line-soft bg-white px-3.5 py-2.5 text-[10.5px] leading-relaxed text-ink-muted">
              <Scale className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
              <p>
                O instrumento é uma <strong className="text-ink-soft">tradução pedagógica</strong> do
                Regulamento, não uma nova regra. O barema oficial e a deliberação da Comissão
                Científica prevalecem (Regulamento, itens 3.6, 5.5 e 7.1).
              </p>
            </div>
          </section>

          <section id="criterios" className="scroll-mt-24">
            <div className="mb-2 flex items-end justify-between gap-2">
              <div>
                <div className="eyebrow">A régua</div>
                <h2 className="display mt-1 text-[24px] font-semibold text-ink">Os cinco critérios</h2>
              </div>
              <Badge tom="neutral">20 pontos cada</Badge>
            </div>
            <div className="space-y-2.5">
              {RUBRICA.map((criterio) => (
                <article key={criterio.id} className="card px-4 py-4 sm:px-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-900 font-serif text-[13px] font-semibold text-white">
                      {criterio.numero}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif text-[17px] font-semibold leading-snug text-ink">
                        {criterio.titulo}
                      </h3>
                      <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-muted">
                        {criterio.pergunta}
                      </p>
                      <div className="mt-2 rounded-xl bg-paper-light px-3 py-2 text-[10.5px] leading-relaxed text-ink-soft">
                        <strong className="text-brand-800">Por que importa:</strong> {criterio.porQue}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {criterio.observar.slice(0, 4).map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-line bg-white px-2 py-0.5 text-[9px] text-ink-muted"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="niveis" className="card scroll-mt-24 overflow-hidden">
            <div className="border-b border-line-soft px-5 py-4">
              <div className="eyebrow">A escala</div>
              <h2 className="display mt-1 text-[24px] font-semibold text-ink">
                O que cada nível significa
              </h2>
              <p className="mt-1 max-w-2xl text-[11.5px] leading-relaxed text-ink-muted">
                Cinco níveis, de 0 a 4. O nível 2 não é “nota baixa”: é o patamar esperado para um
                trabalho em andamento, bem explicado. O nível 4 é destaque, não exigência.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse">
                <thead>
                  <tr className="bg-paper-light">
                    <th className="px-4 py-2 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-ink-muted">Nível</th>
                    <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-ink-muted">Rótulo</th>
                    <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-ink-muted">Pontos</th>
                    <th className="px-4 py-2 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-ink-muted">Como reconhecer</th>
                  </tr>
                </thead>
                <tbody>
                  {RUBRICA[0].niveis.map((nivel) => (
                    <tr key={nivel.valor} className="border-b border-line-soft/70">
                      <td className="px-4 py-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-900 text-[10px] font-bold text-white">
                          {nivel.valor}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge
                          tom={
                            nivel.tom === 'destaque'
                              ? 'green'
                              : nivel.tom === 'adequado'
                                ? 'brand'
                                : nivel.tom === 'desenvolvimento'
                                  ? 'amber'
                                  : nivel.tom === 'atencao'
                                    ? 'rose'
                                    : 'neutral'
                          }
                        >
                          {nivel.rotulo}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] font-semibold text-ink-soft">{nivel.pontos}</td>
                      <td className="px-4 py-2.5 text-[10.5px] leading-snug text-ink-muted">{nivel.descricao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line-soft bg-paper-light px-5 py-3 text-[10px] leading-relaxed text-ink-muted">
              A nota final é a soma dos cinco critérios. Exemplo: níveis 2, 3, 3, 2 e 3 = 10 + 15 +
              15 + 10 + 15 = <strong className="text-ink-soft">65/100</strong> — um trabalho em
              desenvolvimento, com clareza e método coerentes.
            </div>
          </section>

          <section id="sessoes" className="grid gap-3 sm:grid-cols-2">
            <div className="card px-5 py-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-brand-600" />
                <h2 className="font-serif text-[18px] font-semibold text-ink">Sete sessões temáticas</h2>
              </div>
              <ul className="mt-2 space-y-1.5">
                {SESSOES.map((sessao) => (
                  <li key={sessao.numero} className="flex items-start gap-2 text-[10.5px] leading-snug text-ink-soft">
                    <span
                      className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: sessao.cor }}
                    />
                    <span>
                      <strong className="text-ink">{String(sessao.numero).padStart(2, '0')}</strong> ·{' '}
                      {sessao.nome}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card px-5 py-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-brand-600" />
                <h2 className="font-serif text-[18px] font-semibold text-ink">Cinco categorias</h2>
              </div>
              <ul className="mt-2 space-y-1.5">
                {CATEGORIAS.map((categoria) => (
                  <li key={categoria.numero} className="text-[10.5px] leading-snug text-ink-soft">
                    <strong className="text-ink">{categoria.numero}</strong> · {categoria.nome}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[9.5px] leading-relaxed text-ink-muted">
                O critério 3 muda conforme a categoria. Um projeto de pesquisa não precisa ter
                resultados; uma revisão precisa explicar como selecionou as fontes.
              </p>
            </div>
          </section>

          <section id="cobertura" className="card scroll-mt-24 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              <h2 className="display text-[24px] font-semibold text-ink">Cobertura e deliberação</h2>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Bloco
                icone={<Users className="h-3.5 w-3.5" />}
                titulo="Duas avaliações independentes"
                texto="Cada trabalho deve receber duas avaliações concluídas. O painel só considera cobertura completa quando esse mínimo é atingido; rascunhos não contam."
              />
              <Bloco
                icone={<Scale className="h-3.5 w-3.5" />}
                titulo="Divergência vai à comissão"
                texto="Se as notas forem muito distintas, a Comissão Científica aprecia o caso. O app não decide sozinho nem cria uma terceira nota automática."
              />
              <Bloco
                icone={<GraduationCap className="h-3.5 w-3.5" />}
                titulo="Menção por sessão"
                texto="O melhor trabalho de cada sessão recebe Menção Honrosa, conforme o item 7.2. A ata registra a prévia técnica; a concessão é deliberação da comissão."
              />
              <Bloco
                icone={<Sparkles className="h-3.5 w-3.5" />}
                titulo="Destaque formativo"
                texto="Sugestão pedagógica para estudantes de graduação nos períodos iniciais, com média ≥ 15/20 no critério 4. Não é categoria oficial do Regulamento."
              />
            </div>
            <div className="mt-3 rounded-xl border border-line-soft bg-paper-light px-3.5 py-2.5 text-[10.5px] leading-relaxed text-ink-muted">
              <strong className="text-ink-soft">Privacidade:</strong> o avaliador vê apenas os
              trabalhos atribuídos a si; a presidência vê todos os dados. O nome dos membros aparece
              na tela de entrada para facilitar o acesso, mas senhas nunca são comparadas no
              navegador — a autenticação é do Supabase.
            </div>
          </section>

          <section id="links" className="card scroll-mt-24 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-600" />
              <h2 className="display text-[24px] font-semibold text-ink">Documentos oficiais</h2>
            </div>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-muted">
              Consulte sempre a versão publicada pelo DCBV. Os links abaixo são os do site do evento.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <LinkOficial
                titulo="Regulamento da I Semana do DCBV"
                descricao="Regras de submissão, avaliação e premiação"
                href={EVENTO.links.regulamento}
              />
              <LinkOficial
                titulo="Orientações para o resumo"
                descricao="Formato e conteúdo do resumo submetido"
                href={EVENTO.links.orientacoesResumo}
              />
              <LinkOficial
                titulo="Orientações para o banner"
                descricao="Dimensões, seções e legibilidade"
                href={EVENTO.links.orientacoesPoster}
              />
              <LinkOficial
                titulo="Template do pôster"
                descricao="Modelo padrão em PDF"
                href={EVENTO.links.templatePoster}
              />
              <LinkOficial
                titulo="Programação do evento"
                descricao="Sessões, horários e local"
                href={EVENTO.links.programacao}
              />
              <LinkOficial
                titulo="Parecer dos resumos"
                descricao="Lista de trabalhos aprovados"
                href={EVENTO.links.parecer}
              />
            </div>
            <div className="mt-4 border-t border-line-soft pt-3 text-[9.5px] leading-relaxed text-ink-muted">
              <strong className="text-ink-soft">{APLICACAO.nome}</strong> · versão {APLICACAO.versao} ·{' '}
              {APLICACAO.descricao} {APLICACAO.aviso}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Ficha({
  icone,
  rotulo,
  valor,
  detalhe,
}: {
  icone: ReactNode;
  rotulo: string;
  valor: string;
  detalhe: string;
}) {
  return (
    <div className="card px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[8.5px] font-bold uppercase tracking-[0.12em] text-ink-muted">
        <span className="text-brand-600">{icone}</span>
        {rotulo}
      </div>
      <div className="mt-1 text-[13px] font-semibold text-ink">{valor}</div>
      <div className="text-[9.5px] leading-snug text-ink-muted">{detalhe}</div>
    </div>
  );
}

function Bloco({
  icone,
  titulo,
  texto,
}: {
  icone: ReactNode;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="rounded-2xl border border-line-soft bg-paper-light px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-ink">
        <span className="text-brand-600">{icone}</span>
        {titulo}
      </div>
      <p className="mt-1 text-[10px] leading-relaxed text-ink-muted">{texto}</p>
    </div>
  );
}

function LinkOficial({
  titulo,
  descricao,
  href,
}: {
  titulo: string;
  descricao: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="group flex items-start gap-2.5 rounded-2xl border border-line bg-white px-3.5 py-3 transition hover:border-brand-300 hover:bg-brand-50/40"
    >
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        <ExternalLink className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11.5px] font-semibold leading-snug text-ink group-hover:text-brand-800">
          {titulo}
        </span>
        <span className="mt-0.5 block text-[9.5px] text-ink-muted">{descricao}</span>
      </span>
      <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-line group-hover:text-brand-600" />
    </a>
  );
}

