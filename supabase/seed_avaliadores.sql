-- ============================================================================
-- I Semana do DCBV — avaliadores e atribuições iniciais
-- Arquivo: supabase/seed_avaliadores.sql
--
-- ATENÇÃO — CARGA HISTÓRICA (NÃO REAPLICAR NA BASE DE PRODUÇÃO)
-- A base de 16/11/2026 foi corrigida para 94 trabalhos e 94 atribuições,
-- com uma avaliação por trabalho, conforme decisão da Comissão Científica.
-- Este arquivo mantém a carga inicial de 95 atribuições e os códigos que
-- foram removidos. Use a aba Distribuição do app para ajustes na base atual.
--
-- O que este arquivo faz:
--   1. cadastra 18 avaliadores na tabela public.avaliadores (o e-mail é a chave);
--   2. importa 95 atribuições trabalho → avaliador, extraídas do PDF
--      "Trabalhos por avaliador - Bases da Saúde";
--   3. mostra um relatório de cobertura no final.
--
-- O que este arquivo NÃO faz:
--   • não cria senhas nem usuários em Authentication > Users;
--   • não avalia os trabalhos;
--   • não inventa um segundo avaliador para cada trabalho.
--
-- ATENÇÃO — cobertura:
--   O PDF traz exatamente 1 avaliador por trabalho (95 trabalhos distintos).
--   O Regulamento (item 5.1) e o app trabalham com 2 avaliadores por trabalho.
--   Portanto, depois desta carga, os 95 trabalhos ficam com 1 de 2 avaliadores.
--   A segunda atribuição deve ser feita na tela Curadoria → Distribuição,
--   pelo botão "Completar distribuição" ou pela importação de uma lista.
--
-- ATENÇÃO — e-mails:
--   Os e-mails abaixo foram inferidos a partir dos nomes do PDF, porque o PDF
--   não os traz. Confira cada um na lista oficial da comissão. Se algum estiver
--   errado, corrija nesta lista e nas linhas de atribuição: o vínculo é feito
--   por e-mail (o nome não é usado para casar as duas partes).
--
-- Antes de rodar:
--   • a tabela public.trabalhos precisa estar carregada (o 0001_init.sql cria
--     20 trabalhos de demonstração; o banco real pode ter 102);
--   • os códigos são resolvidos por código; os que não existirem aparecem no
--     relatório final e podem ser carregados depois — o arquivo é idempotente;
--   • crie os usuários de Authentication com os mesmos e-mails (Dashboard >
--     Authentication > Users). O vínculo com o cadastro é automático no login.
--   • para dar poder de master a mais alguém, veja o exemplo no final.
--
-- Execute o arquivo inteiro no SQL Editor do Supabase.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Avaliadores (18 pessoas; o 19º item da lista era o mesmo David Henrique)
-- ----------------------------------------------------------------------------
insert into public.avaliadores (nome, email, papel, ativo, ordem)
values
('Fábio Pieri', 'fabio.pieri@ufjf.br', 'avaliador', true, 10),
('Jaqueline Soares da Silva', 'silva.jaquelinesoares@ufjf.br', 'avaliador', true, 20),
('Fernanda Ferreira', 'fernanda.ferreira@ufjf.br', 'avaliador', true, 30),
('Marcelo Ottoni', 'marcelo.ottoni@ufjf.br', 'avaliador', true, 40),
('Ana Carolina', 'anamenezesmv@gmail.com', 'avaliador', true, 50),
('Cibele Velloso Rodrigues', 'cibele.velloso@ufjf.br', 'avaliador', true, 60),
('Carlos Carranza', 'carlos.carranza@ufjf.br', 'avaliador', true, 70),
('Maísa Silva', 'maisa.silva@ufjf.br', 'avaliador', true, 80),
('David Henrique Rodrigues', 'david.henrique@ufjf.br', 'avaliador', true, 90),
('Ione Matos', 'ione.matos@ufjf.br', 'avaliador', true, 100),
('Roberto Lautner', 'roberto.lautner@ufjf.br', 'avaliador', true, 110),
('Vanessa Medeiros', 'vanessa.medeiros@ufjf.br', 'avaliador', true, 120),
('Lauro Maduro', 'lauro.maduro@ufjf.br', 'avaliador', true, 130),
('Georje de Martin', 'georje.martin@ufjf.br', 'avaliador', true, 140),
('Alda Silveira', 'alda.silveira@ufjf.br', 'avaliador', true, 150),
('Alexandra Paiva Araújo', 'alexandra.araujo@ufjf.br', 'avaliador', true, 160),
('Michelle Bueno', 'michelle.antunes@ufjf.br', 'avaliador', true, 170),
('Pauline Leite', 'pauline.leite@ufjf.br', 'avaliador', true, 180)
on conflict (lower(email)) do update
  set nome = excluded.nome,
      -- não rebaixa quem já é presidência/master; só garante o perfil ativo
      ativo = true;

-- ----------------------------------------------------------------------------
-- 2. Atribuições do PDF
--
-- Formato: (código no PDF, e-mail do avaliador, código alternativo no banco).
-- O código alternativo só é usado para o caso 07.04/07.03:
-- o PDF chama de 07.04 o trabalho de dengue que o seed do app chama de 07.03.
-- Se o banco tiver 07.04, ele é preferido; se não, o SQL usa 07.03. Para não
-- atribuir a pessoa ao trabalho errado quando os dois códigos existem, o
-- fallback exige que o título contenha "dengue".
-- ----------------------------------------------------------------------------
with lista_pdf (codigo, email, codigo_alternativo) as (
  values
('03.19', 'fabio.pieri@ufjf.br', null),
('03.15', 'fabio.pieri@ufjf.br', null),
('03.05', 'fabio.pieri@ufjf.br', null),
('06.01', 'fabio.pieri@ufjf.br', null),
('05.15', 'fabio.pieri@ufjf.br', null),
('06.17', 'fabio.pieri@ufjf.br', null),
('07.02', 'fabio.pieri@ufjf.br', null),
('07.06', 'fabio.pieri@ufjf.br', null),
('04.02', 'fabio.pieri@ufjf.br', null),
('03.06', 'silva.jaquelinesoares@ufjf.br', null),
('03.23', 'silva.jaquelinesoares@ufjf.br', null),
('03.16', 'silva.jaquelinesoares@ufjf.br', null),
('03.14', 'fernanda.ferreira@ufjf.br', null),
('03.01', 'fernanda.ferreira@ufjf.br', null),
('03.24', 'fernanda.ferreira@ufjf.br', null),
('05.19', 'fernanda.ferreira@ufjf.br', null),
('05.09', 'fernanda.ferreira@ufjf.br', null),
('05.04', 'fernanda.ferreira@ufjf.br', null),
('03.11', 'marcelo.ottoni@ufjf.br', null),
('03.09', 'marcelo.ottoni@ufjf.br', null),
('03.18', 'marcelo.ottoni@ufjf.br', null),
('05.05', 'marcelo.ottoni@ufjf.br', null),
('05.20', 'marcelo.ottoni@ufjf.br', null),
('04.03', 'marcelo.ottoni@ufjf.br', null),
('04.01', 'marcelo.ottoni@ufjf.br', null),
('02.01', 'marcelo.ottoni@ufjf.br', null),
('03.34', 'anamenezesmv@gmail.com', null),
('03.21', 'anamenezesmv@gmail.com', null),
('03.04', 'anamenezesmv@gmail.com', null),
('03.02', 'anamenezesmv@gmail.com', null),
('03.32', 'cibele.velloso@ufjf.br', null),
('03.20', 'cibele.velloso@ufjf.br', null),
('03.10', 'cibele.velloso@ufjf.br', null),
('03.26', 'carlos.carranza@ufjf.br', null),
('05.22', 'carlos.carranza@ufjf.br', null),
('03.29', 'carlos.carranza@ufjf.br', null),
('03.08', 'maisa.silva@ufjf.br', null),
('05.17', 'maisa.silva@ufjf.br', null),
('03.25', 'maisa.silva@ufjf.br', null),
('06.05', 'maisa.silva@ufjf.br', null),
('06.12', 'maisa.silva@ufjf.br', null),
('06.02', 'maisa.silva@ufjf.br', null),
('03.30', 'david.henrique@ufjf.br', null),
('03.03', 'david.henrique@ufjf.br', null),
('03.28', 'david.henrique@ufjf.br', null),
('06.06', 'david.henrique@ufjf.br', null),
('06.23', 'david.henrique@ufjf.br', null),
('06.19', 'david.henrique@ufjf.br', null),
('05.06', 'ione.matos@ufjf.br', null),
('05.11', 'ione.matos@ufjf.br', null),
('05.24', 'ione.matos@ufjf.br', null),
('05.27', 'ione.matos@ufjf.br', null),
('06.16', 'ione.matos@ufjf.br', null),
('06.08', 'ione.matos@ufjf.br', null),
('06.14', 'ione.matos@ufjf.br', null),
('07.01', 'ione.matos@ufjf.br', null),
('07.04', 'ione.matos@ufjf.br', '07.03'),
('07.05', 'ione.matos@ufjf.br', null),
('05.26', 'roberto.lautner@ufjf.br', null),
('05.23', 'roberto.lautner@ufjf.br', null),
('05.07', 'roberto.lautner@ufjf.br', null),
('05.12', 'vanessa.medeiros@ufjf.br', null),
('05.21', 'vanessa.medeiros@ufjf.br', null),
('05.14', 'vanessa.medeiros@ufjf.br', null),
('05.08', 'vanessa.medeiros@ufjf.br', null),
('06.07', 'vanessa.medeiros@ufjf.br', null),
('06.13', 'vanessa.medeiros@ufjf.br', null),
('01.01', 'vanessa.medeiros@ufjf.br', null),
('05.03', 'lauro.maduro@ufjf.br', null),
('05.01', 'lauro.maduro@ufjf.br', null),
('05.02', 'lauro.maduro@ufjf.br', null),
('05.25', 'lauro.maduro@ufjf.br', null),
('06.18', 'georje.martin@ufjf.br', null),
('06.04', 'georje.martin@ufjf.br', null),
('06.24', 'georje.martin@ufjf.br', null),
('06.26', 'georje.martin@ufjf.br', null),
('06.20', 'alda.silveira@ufjf.br', null),
('06.03', 'alda.silveira@ufjf.br', null),
('06.21', 'alda.silveira@ufjf.br', null),
('03.12', 'alexandra.araujo@ufjf.br', null),
('03.22', 'alexandra.araujo@ufjf.br', null),
('03.07', 'alexandra.araujo@ufjf.br', null),
('03.31', 'alexandra.araujo@ufjf.br', null),
('05.10', 'alexandra.araujo@ufjf.br', null),
('05.18', 'alexandra.araujo@ufjf.br', null),
('06.25', 'alexandra.araujo@ufjf.br', null),
('02.04', 'alexandra.araujo@ufjf.br', null),
('03.17', 'alexandra.araujo@ufjf.br', null),
('02.03', 'alexandra.araujo@ufjf.br', null),
('06.09', 'michelle.antunes@ufjf.br', null),
('06.10', 'michelle.antunes@ufjf.br', null),
('03.27', 'michelle.antunes@ufjf.br', null),
('02.05', 'pauline.leite@ufjf.br', null),
('06.22', 'pauline.leite@ufjf.br', null),
('06.15', 'pauline.leite@ufjf.br', null)
),
resolvidas as (
  select
    l.codigo,
    l.email,
    coalesce(t.id, t_alt.id) as trabalho_id,
    a.id as avaliador_id
  from lista_pdf l
  left join public.trabalhos t
    on t.codigo = l.codigo
   and (l.codigo <> '07.04' or t.titulo ilike '%dengue%')
  left join public.trabalhos t_alt
    on t_alt.codigo = l.codigo_alternativo
   and (l.codigo <> '07.04' or t_alt.titulo ilike '%dengue%')
  join public.avaliadores a on lower(a.email) = lower(l.email)
)
insert into public.atribuicoes (id, trabalho_id, avaliador_id)
select
  r.trabalho_id || ':' || r.avaliador_id::text,
  r.trabalho_id,
  r.avaliador_id
from resolvidas r
where r.trabalho_id is not null
on conflict do nothing;

commit;

-- ----------------------------------------------------------------------------
-- 3. Relatório de conferência
--    O SQL Editor mostra o resultado da última consulta.
-- ----------------------------------------------------------------------------
with
lista_pdf (codigo, email) as (
  values
('03.19', 'fabio.pieri@ufjf.br'),
('03.15', 'fabio.pieri@ufjf.br'),
('03.05', 'fabio.pieri@ufjf.br'),
('06.01', 'fabio.pieri@ufjf.br'),
('05.15', 'fabio.pieri@ufjf.br'),
('06.17', 'fabio.pieri@ufjf.br'),
('07.02', 'fabio.pieri@ufjf.br'),
('07.06', 'fabio.pieri@ufjf.br'),
('04.02', 'fabio.pieri@ufjf.br'),
('03.06', 'silva.jaquelinesoares@ufjf.br'),
('03.23', 'silva.jaquelinesoares@ufjf.br'),
('03.16', 'silva.jaquelinesoares@ufjf.br'),
('03.14', 'fernanda.ferreira@ufjf.br'),
('03.01', 'fernanda.ferreira@ufjf.br'),
('03.24', 'fernanda.ferreira@ufjf.br'),
('05.19', 'fernanda.ferreira@ufjf.br'),
('05.09', 'fernanda.ferreira@ufjf.br'),
('05.04', 'fernanda.ferreira@ufjf.br'),
('03.11', 'marcelo.ottoni@ufjf.br'),
('03.09', 'marcelo.ottoni@ufjf.br'),
('03.18', 'marcelo.ottoni@ufjf.br'),
('05.05', 'marcelo.ottoni@ufjf.br'),
('05.20', 'marcelo.ottoni@ufjf.br'),
('04.03', 'marcelo.ottoni@ufjf.br'),
('04.01', 'marcelo.ottoni@ufjf.br'),
('02.01', 'marcelo.ottoni@ufjf.br'),
('03.34', 'anamenezesmv@gmail.com'),
('03.21', 'anamenezesmv@gmail.com'),
('03.04', 'anamenezesmv@gmail.com'),
('03.02', 'anamenezesmv@gmail.com'),
('03.32', 'cibele.velloso@ufjf.br'),
('03.20', 'cibele.velloso@ufjf.br'),
('03.10', 'cibele.velloso@ufjf.br'),
('03.26', 'carlos.carranza@ufjf.br'),
('05.22', 'carlos.carranza@ufjf.br'),
('03.29', 'carlos.carranza@ufjf.br'),
('03.08', 'maisa.silva@ufjf.br'),
('05.17', 'maisa.silva@ufjf.br'),
('03.25', 'maisa.silva@ufjf.br'),
('06.05', 'maisa.silva@ufjf.br'),
('06.12', 'maisa.silva@ufjf.br'),
('06.02', 'maisa.silva@ufjf.br'),
('03.30', 'david.henrique@ufjf.br'),
('03.03', 'david.henrique@ufjf.br'),
('03.28', 'david.henrique@ufjf.br'),
('06.06', 'david.henrique@ufjf.br'),
('06.23', 'david.henrique@ufjf.br'),
('06.19', 'david.henrique@ufjf.br'),
('05.06', 'ione.matos@ufjf.br'),
('05.11', 'ione.matos@ufjf.br'),
('05.24', 'ione.matos@ufjf.br'),
('05.27', 'ione.matos@ufjf.br'),
('06.16', 'ione.matos@ufjf.br'),
('06.08', 'ione.matos@ufjf.br'),
('06.14', 'ione.matos@ufjf.br'),
('07.01', 'ione.matos@ufjf.br'),
('07.04', 'ione.matos@ufjf.br'),
('07.05', 'ione.matos@ufjf.br'),
('05.26', 'roberto.lautner@ufjf.br'),
('05.23', 'roberto.lautner@ufjf.br'),
('05.07', 'roberto.lautner@ufjf.br'),
('05.12', 'vanessa.medeiros@ufjf.br'),
('05.21', 'vanessa.medeiros@ufjf.br'),
('05.14', 'vanessa.medeiros@ufjf.br'),
('05.08', 'vanessa.medeiros@ufjf.br'),
('06.07', 'vanessa.medeiros@ufjf.br'),
('06.13', 'vanessa.medeiros@ufjf.br'),
('01.01', 'vanessa.medeiros@ufjf.br'),
('05.03', 'lauro.maduro@ufjf.br'),
('05.01', 'lauro.maduro@ufjf.br'),
('05.02', 'lauro.maduro@ufjf.br'),
('05.25', 'lauro.maduro@ufjf.br'),
('06.18', 'georje.martin@ufjf.br'),
('06.04', 'georje.martin@ufjf.br'),
('06.24', 'georje.martin@ufjf.br'),
('06.26', 'georje.martin@ufjf.br'),
('06.20', 'alda.silveira@ufjf.br'),
('06.03', 'alda.silveira@ufjf.br'),
('06.21', 'alda.silveira@ufjf.br'),
('03.12', 'alexandra.araujo@ufjf.br'),
('03.22', 'alexandra.araujo@ufjf.br'),
('03.07', 'alexandra.araujo@ufjf.br'),
('03.31', 'alexandra.araujo@ufjf.br'),
('05.10', 'alexandra.araujo@ufjf.br'),
('05.18', 'alexandra.araujo@ufjf.br'),
('06.25', 'alexandra.araujo@ufjf.br'),
('02.04', 'alexandra.araujo@ufjf.br'),
('03.17', 'alexandra.araujo@ufjf.br'),
('02.03', 'alexandra.araujo@ufjf.br'),
('06.09', 'michelle.antunes@ufjf.br'),
('06.10', 'michelle.antunes@ufjf.br'),
('03.27', 'michelle.antunes@ufjf.br'),
('02.05', 'pauline.leite@ufjf.br'),
('06.22', 'pauline.leite@ufjf.br'),
('06.15', 'pauline.leite@ufjf.br')
),
total_avaliadores as (
  select count(*)::int as n
  from public.avaliadores
  where lower(email) in (select lower(email) from lista_pdf)
),
atribuicoes_pdf as (
  select count(*)::int as n
  from public.atribuicoes at
  join public.avaliadores a on a.id = at.avaliador_id
  where exists (
    select 1
    from lista_pdf l
    join public.trabalhos t on t.id = at.trabalho_id
    where lower(l.email) = lower(a.email)
      and (
        (t.codigo = l.codigo
         and (l.codigo <> '07.04' or t.titulo ilike '%dengue%'))
        or (l.codigo = '07.04' and t.codigo = '07.03' and t.titulo ilike '%dengue%')
      )
  )
),
sem_avaliador as (
  select count(*)::int as n
  from public.trabalhos t
  where not exists (select 1 from public.atribuicoes at where at.trabalho_id = t.id)
),
com_um as (
  select count(*)::int as n
  from public.trabalhos t
  where (select count(*) from public.atribuicoes at where at.trabalho_id = t.id) = 1
),
com_dois_ou_mais as (
  select count(*)::int as n
  from public.trabalhos t
  where (select count(*) from public.atribuicoes at where at.trabalho_id = t.id) >= 2
),
codigos_sem_trabalho as (
  select count(distinct l.codigo)::int as n
  from lista_pdf l
  where not exists (
    select 1 from public.trabalhos t
    where (t.codigo = l.codigo
           and (l.codigo <> '07.04' or t.titulo ilike '%dengue%'))
       or (l.codigo = '07.04' and t.codigo = '07.03' and t.titulo ilike '%dengue%')
  )
),
emails_sem_cadastro as (
  select count(distinct l.email)::int as n
  from lista_pdf l
  where not exists (
    select 1 from public.avaliadores a where lower(a.email) = lower(l.email)
  )
),
total_trabalhos as (
  select count(*)::int as n from public.trabalhos
),
codigos_ausentes as (
  select coalesce(string_agg(distinct l.codigo, ', ' order by l.codigo), 'nenhum') as lista
  from lista_pdf l
  where not exists (
    select 1 from public.trabalhos t
    where (t.codigo = l.codigo
           and (l.codigo <> '07.04' or t.titulo ilike '%dengue%'))
       or (l.codigo = '07.04' and t.codigo = '07.03' and t.titulo ilike '%dengue%')
  )
),
emails_ausentes as (
  select coalesce(string_agg(distinct l.email, ', ' order by l.email), 'nenhum') as lista
  from lista_pdf l
  where not exists (
    select 1 from public.avaliadores a where lower(a.email) = lower(l.email)
  )
)
select 'Trabalhos cadastrados na base' as indicador, total_trabalhos.n::text as valor from total_trabalhos
union all
select 'Avaliadores do PDF cadastrados' as indicador, total_avaliadores.n::text as valor from total_avaliadores
union all
select 'Atribuições do PDF presentes na base', atribuicoes_pdf.n::text from atribuicoes_pdf
union all
select 'Trabalhos com 0 avaliadores', sem_avaliador.n::text from sem_avaliador
union all
select 'Trabalhos com 1 avaliador (falta o 2º)', com_um.n::text from com_um
union all
select 'Trabalhos com 2 ou mais avaliadores', com_dois_ou_mais.n::text from com_dois_ou_mais
union all
select 'Códigos do PDF sem trabalho correspondente', codigos_sem_trabalho.n::text from codigos_sem_trabalho
union all
select 'E-mails do PDF sem cadastro de avaliador', emails_sem_cadastro.n::text from emails_sem_cadastro
union all
select 'Códigos ausentes (para conferir)', codigos_ausentes.lista from codigos_ausentes
union all
select 'E-mails ausentes (para conferir)', emails_ausentes.lista from emails_ausentes;

-- Depois de importar os trabalhos que faltavam, rode este arquivo de novo:
-- ele é idempotente e completará apenas as atribuições que ainda não existem.

-- Para promover uma conta já cadastrada a master (presidência), descomente e
-- troque o e-mail. Não é preciso recriar o usuário no Auth:
-- update public.avaliadores
--    set papel = 'presidente'
--  where lower(email) = lower('marcio.souza@ufjf.br');
