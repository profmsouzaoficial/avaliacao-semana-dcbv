-- ============================================================================
-- Bancas DCBV — esquema inicial (Supabase / PostgreSQL)
-- Execute este arquivo inteiro no SQL Editor do projeto Supabase.
--
-- O que este arquivo faz:
--   1. cria as quatro tabelas do app (avaliadores, trabalhos, atribuicoes,
--      avaliacoes) com chaves, restrições e índices;
--   2. cria as funções de vínculo entre Auth e o cadastro da comissão;
--   3. ativa RLS: presidência vê tudo; avaliador vê apenas o que é seu;
--   4. semeia os 20 trabalhos do parecer usados na demonstração.
--
-- Antes de rodar, crie ao menos um usuário em Authentication > Users e
-- cadastre a presidência conforme supabase/README.md.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. Tabelas
-- ----------------------------------------------------------------------------

create table if not exists public.avaliadores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  nome text not null,
  email text not null,
  titulacao text not null default '',
  instituicao text not null default '',
  papel text not null default 'avaliador' check (papel in ('presidente', 'avaliador')),
  ativo boolean not null default true,
  ordem integer not null default 100,
  created_at timestamptz not null default now()
);

create unique index if not exists avaliadores_email_lower_idx
  on public.avaliadores (lower(email));

create table if not exists public.trabalhos (
  id text primary key,
  codigo text not null unique check (codigo ~ '^[0-9]{2}\.[0-9]{2}$'),
  titulo text not null,
  sessao smallint not null check (sessao between 1 and 7),
  categoria smallint not null check (categoria between 1 and 5),
  apresentador text not null default '',
  autores text not null default '',
  orientador text not null default '',
  instituicao text not null default '',
  periodo text not null default '',
  nivel text not null default 'outro'
    check (nivel in ('graduacao', 'pos-graduacao', 'docente', 'outro')),
  resumo text not null default '',
  link_pdf text not null default '',
  observacoes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.atribuicoes (
  id text primary key,
  trabalho_id text not null references public.trabalhos (id) on delete cascade,
  avaliador_id uuid not null references public.avaliadores (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (trabalho_id, avaliador_id)
);

create index if not exists atribuicoes_trabalho_idx on public.atribuicoes (trabalho_id);
create index if not exists atribuicoes_avaliador_idx on public.atribuicoes (avaliador_id);

create table if not exists public.avaliacoes (
  id text primary key,
  trabalho_id text not null references public.trabalhos (id) on delete cascade,
  avaliador_id uuid not null references public.avaliadores (id) on delete cascade,
  notas jsonb not null default '{}'::jsonb check (jsonb_typeof(notas) = 'object'),
  nota_final numeric(5, 2) not null default 0 check (nota_final between 0 and 100),
  parecer text not null default '',
  pontos_fortes text not null default '',
  sugestoes text not null default '',
  indicacao_mencao boolean not null default false,
  justificativa_mencao text not null default '',
  concluida boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (trabalho_id, avaliador_id)
);

create index if not exists avaliacoes_trabalho_idx on public.avaliacoes (trabalho_id);
create index if not exists avaliacoes_avaliador_idx on public.avaliacoes (avaliador_id);

-- ----------------------------------------------------------------------------
-- 2. Atualização de timestamp e proteção da última presidência
-- ----------------------------------------------------------------------------

create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trabalhos_updated_at on public.trabalhos;
create trigger trabalhos_updated_at
  before update on public.trabalhos
  for each row execute function public.tocar_updated_at();

drop trigger if exists avaliacoes_updated_at on public.avaliacoes;
create trigger avaliacoes_updated_at
  before update on public.avaliacoes
  for each row execute function public.tocar_updated_at();

-- Evita que a comissão fique sem uma presidência ativa por engano.
create or replace function public.proteger_presidencia()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.ativo and old.papel = 'presidente'
       and not exists (
         select 1 from public.avaliadores
         where id <> old.id and papel = 'presidente' and ativo
       ) then
      raise exception 'A comissão precisa de ao menos uma presidência ativa.';
    end if;
    return old;
  end if;

  if old.ativo and old.papel = 'presidente'
     and (new.papel <> 'presidente' or new.ativo = false)
     and not exists (
       select 1 from public.avaliadores
       where id <> old.id and papel = 'presidente' and ativo
     ) then
    raise exception 'A comissão precisa de ao menos uma presidência ativa.';
  end if;

  return new;
end;
$$;

drop trigger if exists avaliadores_protege_presidencia on public.avaliadores;
create trigger avaliadores_protege_presidencia
  before update or delete on public.avaliadores
  for each row execute function public.proteger_presidencia();

-- ----------------------------------------------------------------------------
-- 3. Funções de autorização (security definer para não recursar na RLS)
-- ----------------------------------------------------------------------------

create or replace function public.meu_avaliador_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.avaliadores
  where user_id = auth.uid() and ativo
  limit 1;
$$;

create or replace function public.eh_presidente()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.avaliadores
    where user_id = auth.uid() and papel = 'presidente' and ativo
  );
$$;

create or replace function public.tem_atribuicao(p_trabalho_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.atribuicoes
    where trabalho_id = p_trabalho_id
      and avaliador_id = public.meu_avaliador_id()
  );
$$;

-- Vincula, no primeiro login, o usuário do Auth ao cadastro da comissão cujo
-- e-mail coincide. Idempotente: não sobrescreve vínculo com outro usuário.
create or replace function public.vincular_meu_usuario()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_id uuid;
begin
  if auth.uid() is null then
    return;
  end if;

  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if v_email = '' then
    return;
  end if;

  select id
    into v_id
    from public.avaliadores
   where lower(email) = v_email
     and (user_id is null or user_id = auth.uid())
   order by (user_id = auth.uid()) desc, created_at asc
   limit 1;

  if v_id is null then
    return;
  end if;

  update public.avaliadores
     set user_id = auth.uid()
   where id = v_id
     and (user_id is null or user_id = auth.uid());
end;
$$;

revoke all on function public.meu_avaliador_id() from public;
revoke all on function public.eh_presidente() from public;
revoke all on function public.tem_atribuicao(text) from public;
revoke all on function public.vincular_meu_usuario() from public;

-- ----------------------------------------------------------------------------
-- 4. Row Level Security
-- ----------------------------------------------------------------------------

alter table public.avaliadores enable row level security;
alter table public.trabalhos enable row level security;
alter table public.atribuicoes enable row level security;
alter table public.avaliacoes enable row level security;

-- avaliadores: membros ativos são visíveis; inativos só para si/presidência.
drop policy if exists "avaliadores leem membros" on public.avaliadores;
create policy "avaliadores leem membros"
  on public.avaliadores for select
  to authenticated
  using (ativo or user_id = auth.uid() or public.eh_presidente());

drop policy if exists "presidencia gere avaliadores" on public.avaliadores;
create policy "presidencia gere avaliadores"
  on public.avaliadores for all
  to authenticated
  using (public.eh_presidente())
  with check (public.eh_presidente());

-- trabalhos: presidência vê tudo; avaliador vê apenas os atribuídos a si.
drop policy if exists "trabalhos visiveis" on public.trabalhos;
create policy "trabalhos visiveis"
  on public.trabalhos for select
  to authenticated
  using (public.eh_presidente() or public.tem_atribuicao(id));

drop policy if exists "presidencia gere trabalhos" on public.trabalhos;
create policy "presidencia gere trabalhos"
  on public.trabalhos for all
  to authenticated
  using (public.eh_presidente())
  with check (public.eh_presidente());

-- atribuicoes: o avaliador vê as suas; só a presidência distribui.
drop policy if exists "atribuicoes visiveis" on public.atribuicoes;
create policy "atribuicoes visiveis"
  on public.atribuicoes for select
  to authenticated
  using (public.eh_presidente() or avaliador_id = public.meu_avaliador_id());

drop policy if exists "presidencia distribui" on public.atribuicoes;
create policy "presidencia distribui"
  on public.atribuicoes for all
  to authenticated
  using (public.eh_presidente())
  with check (public.eh_presidente());

-- avaliacoes: avaliador lê e grava apenas as suas; presidência lê todas.
drop policy if exists "avaliacoes visiveis" on public.avaliacoes;
create policy "avaliacoes visiveis"
  on public.avaliacoes for select
  to authenticated
  using (public.eh_presidente() or avaliador_id = public.meu_avaliador_id());

drop policy if exists "avaliador grava a propria avaliacao" on public.avaliacoes;
create policy "avaliador grava a propria avaliacao"
  on public.avaliacoes for insert
  to authenticated
  with check (
    avaliador_id = public.meu_avaliador_id()
    and public.tem_atribuicao(trabalho_id)
  );

drop policy if exists "avaliador atualiza a propria avaliacao" on public.avaliacoes;
create policy "avaliador atualiza a propria avaliacao"
  on public.avaliacoes for update
  to authenticated
  using (
    avaliador_id = public.meu_avaliador_id()
    and public.tem_atribuicao(trabalho_id)
  )
  with check (
    avaliador_id = public.meu_avaliador_id()
    and public.tem_atribuicao(trabalho_id)
  );

drop policy if exists "avaliador ou presidencia apaga avaliacao" on public.avaliacoes;
create policy "avaliador ou presidencia apaga avaliacao"
  on public.avaliacoes for delete
  to authenticated
  using (public.eh_presidente() or avaliador_id = public.meu_avaliador_id());

-- Privilégios explícitos: nada de acesso anônimo às tabelas.
revoke all on public.avaliadores, public.trabalhos, public.atribuicoes, public.avaliacoes from anon;
grant select, insert, update, delete
  on public.avaliadores, public.trabalhos, public.atribuicoes, public.avaliacoes
  to authenticated;

grant execute on function public.meu_avaliador_id() to authenticated;
grant execute on function public.eh_presidente() to authenticated;
grant execute on function public.tem_atribuicao(text) to authenticated;
grant execute on function public.vincular_meu_usuario() to authenticated;

-- ----------------------------------------------------------------------------
-- 5. Semente de trabalhos (títulos do parecer oficial de 03/11/2026)
--    Autoria, apresentador e instituição ficam em branco de propósito:
--    o parecer não os informa e o app não inventa dados.
-- ----------------------------------------------------------------------------
insert into public.trabalhos (id, codigo, titulo, sessao, categoria, apresentador, autores, orientador, instituicao, periodo, nivel, resumo, link_pdf, observacoes) values
  ('01.01', '01.01', 'Perfil epidemiológico dos óbitos infantis por malformações congênitas do aparelho circulatório: estudo descritivo de séries temporais no Brasil, 2015-2024', 1, 3, '', '', '', '', '', 'outro', '', '', ''),
  ('02.01', '02.01', 'Alteração hormonal em mulheres pós-menopausa e os efeitos fisiológicos na regulação da atividade osteoclástica', 2, 1, '', '', '', '', '', 'outro', '', '', ''),
  ('02.03', '02.03', 'Alterações endócrinas induzidas por escorpionismo: evidências da literatura', 2, 1, '', '', '', '', '', 'outro', '', '', ''),
  ('02.04', '02.04', 'Atividade do óleo essencial de Cymbopogon densiflorus (Steud.) Stapf. em células C6/36, derivadas de larvas do mosquito Aedes albopictus: uma abordagem in vitro e in silico', 2, 3, '', '', '', '', '', 'outro', '', '', ''),
  ('02.05', '02.05', 'Uso de anelídeos no ensino de biofísica — canais iônicos, potencial de ação e anestesia local', 2, 5, '', '', '', '', '', 'outro', '', '', ''),
  ('03.01', '03.01', 'A dimensão transnacional da hanseníase: Leste de Minas e os Estados Unidos', 3, 3, '', '', '', '', '', 'outro', '', '', ''),
  ('03.02', '03.02', 'Análise do perfil sociodemográfico de indivíduos com anticorpos anti-LID-1 e anti-PGL-1 de regiões endêmicas', 3, 3, '', '', '', '', '', 'outro', '', '', ''),
  ('03.03', '03.03', 'Arboviroses urbanas na macrorregião Leste de Minas Gerais: perfil epidemiológico e contribuições para a gestão em saúde (2015–2024)', 3, 3, '', '', '', '', '', 'outro', '', '', ''),
  ('04.01', '04.01', 'Aspectos genéticos e clínicos da anemia de Fanconi', 4, 1, '', '', '', '', '', 'outro', '', '', ''),
  ('04.02', '04.02', 'Efeito da inibição da atividade quinase de FAK em células de glioblastoma', 4, 3, '', '', '', '', '', 'outro', '', '', ''),
  ('04.03', '04.03', 'Os efeitos dos produtos do cacau em indivíduos com síndrome metabólica e doenças relacionadas: uma revisão sistemática e meta-análise', 4, 1, '', '', '', '', '', 'outro', '', '', ''),
  ('05.01', '05.01', 'A gameterapia domiciliar como recurso fisioterapêutico inovador para prevenção de quedas em idosos', 5, 5, '', '', '', '', '', 'outro', '', '', ''),
  ('05.02', '05.02', 'Análise da evolução temporal da taxa de internações por condições sensíveis à atenção primária em Governador Valadares (2018-2025)', 5, 3, '', '', '', '', '', 'outro', '', '', ''),
  ('05.03', '05.03', 'Análise da relação agonista/antagonista dos músculos do joelho e quadril e do salto lateral em atletas de futebol', 5, 3, '', '', '', '', '', 'outro', '', '', ''),
  ('06.01', '06.01', 'A articulação entre ciências básicas e aplicadas como fundamento para o ensino da ginástica: relato de experiência sobre a formação em extensão universitária', 6, 5, '', '', '', '', '', 'outro', '', '', ''),
  ('06.04', '06.04', 'Alfabetização científica na educação básica: uma revisão de literatura sobre o ensino por investigação e a transformação social', 6, 1, '', '', '', '', '', 'outro', '', '', ''),
  ('06.05', '06.05', 'Atividade prática de tipagem sanguínea em escola: relato de experiência', 6, 5, '', '', '', '', '', 'outro', '', '', ''),
  ('07.01', '07.01', 'A instrumentalização ideológica da ciência: como a retórica da extrema direita impulsiona a queda vacinal e a ressurgência epidemiológica', 7, 1, '', '', '', '', '', 'outro', '', '', ''),
  ('07.02', '07.02', 'A padronização do corpo humano na pesquisa biomédica: os vieses androcêntrico e racial na produção do conhecimento científico', 7, 1, '', '', '', '', '', 'outro', '', '', ''),
  ('07.03', '07.03', 'Associação entre variáveis climáticas (temperatura e pluviosidade) e incidência de dengue em Governador Valadares-MG (2018-2025)', 7, 3, '', '', '', '', '', 'outro', '', '', '')
on conflict (id) do nothing;
