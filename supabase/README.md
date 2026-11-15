# Supabase — Bancas DCBV

Este diretório contém o esquema do banco, as políticas de acesso e o roteiro de
implantação. O app funciona sem Supabase em **modo demonstração**; o Supabase é
necessário para uso real com login e dados compartilhados entre a banca.

## 1. Criar o projeto

1. Crie um projeto em <https://supabase.com/dashboard>.
2. Anote a **Project URL** e a **publishable key** (Settings > API).
3. Copie `.env.example` para `.env.local` e preencha os valores:

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

Se a integração Supabase da Vercel criar as variáveis sem prefixo, também
funciona:

```env
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
```

> O prefixo `VITE_` não é uma camada de segurança: ele só marca o que o Vite
> embute no navegador. A publishable/anon key é pública por design; a proteção
> real vem das políticas de RLS e da autenticação. Nunca coloque a `service_role`
> no front-end. O build recusa chaves `sb_secret_` e JWTs com papel
> `service_role`.

## 2. Rodar a migração

No **SQL Editor**, cole e execute o conteúdo inteiro de
[`migrations/0001_init.sql`](migrations/0001_init.sql). Ela cria:

| Tabela | Papel |
|---|---|
| `avaliadores` | cadastro da comissão, papel e vínculo opcional com `auth.users` |
| `trabalhos` | pôsteres aprovados, identificados pelo código `NN.NN` |
| `atribuicoes` | quais trabalhos cada avaliador deve avaliar |
| `avaliacoes` | notas, feedback, indicação de menção e status |

A migração também semeia os **20 trabalhos** usados na demonstração, com os
títulos exatamente como aparecem no parecer oficial. Autoria, apresentador,
instituição e período ficam em branco de propósito: o parecer não os informa.
A base completa de **102 trabalhos aprovados** entra pelo script
`npm run dados:importar -- --aplicar`, que lê a planilha oficial e preenche
autoria, apresentador e instituição.

### 2.1 Carga dos avaliadores e das atribuições do PDF

Depois da migração, rode [`seed_avaliadores.sql`](seed_avaliadores.sql) no SQL
Editor. Ele:

- cadastra **18 avaliadores**: a lista tinha 19 nomes, mas “David Henrique” e
  “David Henrique Rodrigues” são a mesma pessoa; “Alexandra Paiva” e “Alexandra
  Paiva Araújo” também foram consolidadas;
- importa **95 atribuições** extraídas do PDF “Trabalhos por avaliador”;
- **não cria** usuários no Auth, senhas, notas ou avaliações;
- termina com um relatório de cobertura.

> **Confira os e-mails antes de executar.** O PDF não traz e-mails; os endereços
> do seed foram inferidos dos nomes. Se a lista oficial tiver outro endereço,
> corrija tanto o cadastro quanto as linhas de atribuição. O vínculo é por
> e-mail; o nome não é usado para casar as duas partes.

O arquivo é **idempotente**: rodar de novo atualiza os nomes e insere apenas as
atribuições que ainda não existem. Se você importar os trabalhos que faltavam
depois, rode o seed outra vez; ele completa os vínculos que antes não tinham
trabalho correspondente.

**Cobertura:** o PDF lista **um avaliador por trabalho**. O Regulamento (item
5.1) e o app trabalham com **dois**. Portanto, depois do seed, cada trabalho do
PDF fica com 1 de 2; a segunda atribuição deve ser feita em **Curadoria →
Distribuição** (botão **Completar distribuição**) ou por **Importar lista**.

**Duplicatas:** a planilha tem 102 linhas, mas 7 títulos aparecem em dois
códigos (`03.13/03.14`, `03.17/05.13`, `03.22/05.16`, `03.33/03.34`,
`06.02/06.03`, `06.11/06.12`, `07.03/07.04`). O PDF atribuiu um código da
maioria dos pares, **os dois** no par `06.02/06.03`, e não atribuiu o `03.35`
(que não tem par). A interface marca esses 14 registros como **duplicata**; não
funda os registros sozinha. A comissão deve escolher o código oficial e, se for
o caso, migrar uma das atribuições de `06.02/06.03` para `03.35`.

### 2.2 Carga dos 102 trabalhos oficiais

Depois de criar os perfis, rode na máquina do administrador:

```bash
npm run dados:importar              # conferência, não grava
npm run dados:importar -- --aplicar # grava
```

O script lê [`dados/trabalhos_oficiais.json`](dados/trabalhos_oficiais.json),
insere os 82 trabalhos que faltam, preenche os campos de autoria dos 20 já
existentes e aplica as 95 atribuições do PDF. Ele **não apaga** trabalhos,
avaliações ou atribuições; a única remoção é a atribuição legada
`07.03 → Ione Matos`, feita somente quando o `07.04` existe e não há avaliação
registrada.

> **Categoria:** o parecer e o formulário não informam a categoria metodológica
> (1–5). Os 82 trabalhos novos entram com categoria 1 e a observação
> “Categoria metodológica a confirmar”; o app mostra **A confirmar** e a
> Curadoria oferece o filtro correspondente. Revise antes da avaliação.

**Caso 07.04 / 07.03:** o PDF chama de `07.04` o trabalho de dengue que o seed
da demo chama de `07.03`. O seed tenta primeiro `07.04`; se ele não existir — ou
se existir mas o título não contiver “dengue” — tenta `07.03`. Depois da carga
oficial, o script mantém `07.04` e retira a atribuição legada do `07.03` quando
seguro. Confira a matriz se algum código ficar sem atribuição.

## 3. Criar o primeiro acesso

> **Não existe senha padrão.** O seed cria apenas o registro da comissão em
> `avaliadores`; ele não cria usuário nem senha no Auth. A senha do login é
> definida por você em **Authentication > Users**. A chave anon/publishable e a
> senha do banco Postgres não servem para entrar no app.

1. Em **Authentication > Users**, clique em **Add user** e crie o usuário da
   presidência com e-mail e senha (marque o e-mail como confirmado).
2. Edite e rode [`seed_presidente.sql`](seed_presidente.sql), trocando nome,
   e-mail e instituição pelos dados reais.
3. Abra o app, entre com esse e-mail e senha. A função
   `vincular_meu_usuario()` liga o usuário do Auth ao registro da comissão no
   primeiro login.

Se o login autenticar mas retornar “não cadastrado como membro”, confira se o
e-mail de `avaliadores.email` é **exatamente** o mesmo do Auth (o app compara
sem diferenciar maiúsculas/minúsculas).

### Criar os 18 acessos de uma vez (opcional)

O SQL não consegue definir senha do Auth: a senha é criada pela Admin API ou
pelo Dashboard, não por `insert into auth.users`. Para os avaliadores, existe um
script local que cria as contas que faltam e redefine as existentes com
**senha = e-mail**:

```bash
npm run auth:senhas                  # confere, sem alterar nada
npm run auth:senhas -- --aplicar     # cria/redefine
```

Antes, coloque no `.env.local` (ignorado pelo git):

```dotenv
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_SUA_CHAVE
```

A chave `service_role`/secret **nunca** vai para o Vercel, para o bundle ou para
o repositório; o script roda apenas na sua máquina. O modo padrão considera
perfis ativos com `papel = 'avaliador'` e **não mexe na senha dos masters**. Se
algum dos 18 foi promovido a `presidente`, use `--incluir-masters` para criar a
conta dele também. Contas que já têm `user_id` vinculado são **preservadas**;
use `--redefinir-vinculados` apenas se quiser trocar a senha delas.

> **Isso é desaconselhado em produção aberta.** O e-mail é visível para os
> membros autenticados; quem souber o e-mail de outro avaliador pode entrar na
> conta dele. A comissão precisa aceitar esse risco. O app também não tem tela
> de troca de senha; a senha continua sendo administrada no Supabase.

Também é possível fazer manualmente: **Authentication > Users > Add user** para
cada e-mail, com a senha igual ao e-mail e **Auto Confirm User** marcado. O
script só automatiza esses 18 cliques.

## 4. Cadastrar os demais membros

Há dois caminhos:

- **Pelo app:** entre como presidência/master > **Curadoria > Membros > Novo
  membro** (ou **Distribuição > Novo avaliador**). Depois crie o usuário
  correspondente em **Authentication > Users**. No primeiro login, o vínculo
  será feito pelo e-mail.
- **Pelo SQL:** insira os registros em `avaliadores` e crie os usuários do Auth.

Se a política da comissão for **senha = e-mail**, depois de cadastrar o perfil
basta rodar `npm run auth:senhas -- --aplicar` de novo: o script encontra os
perfis ativos que ainda não têm conta e cria as contas que faltam.

Um membro inativo mantém o histórico, mas não recebe novas atribuições e não
consegue entrar (o app encerra a sessão com mensagem explicativa).

### Vários masters

Não existe um único “admin” global. Cada linha de `avaliadores` com
`papel = 'presidente'` e `ativo = true` é um master: vê todos os trabalhos, faz
atribuições, gerencia membros e gera a ata. Para promover alguém que já existe:

```sql
update public.avaliadores
   set papel = 'presidente'
 where lower(email) = lower('pessoa@ufjf.br');
```

A função `proteger_presidencia()` impede rebaixar ou desativar a **última**
presidência ativa. Cadastre/promova outro master antes de rebaixar o atual.

### Atribuir por lista (na hora)

Em **Curadoria → Distribuição → Importar lista**, cole linhas no formato:

```text
avaliador1@ufjf.br;03.19
avaliador2@ufjf.br;03.19
```

Também aceita `código;e-mail`, vírgula ou tabulação, e um arquivo `.csv`/`.txt`.
A tela mostra a prévia, os já existentes e os erros; só libera **Aplicar** quando
não há problema. Ela não cria perfis automaticamente — use **Novo avaliador**
para isso e depois crie o usuário no Auth.

## 5. Segurança e privacidade

O RLS está ativo nas quatro tabelas:

| Quem | Vê trabalhos | Vê atribuições | Vê avaliações | Gerencia cadastros |
|---|---|---|---|---|
| **Presidência** | todos | todas | todas | sim |
| **Avaliador(a)** | só os atribuídos a si | só as suas | só as suas | não |
| **Anônimo** | nada | nada | nada | nada |

As funções `meu_avaliador_id()`, `eh_presidente()` e `tem_atribuicao()` são
`security definer` para evitar recursão de RLS. A função
`proteger_presidencia()` impede que a última presidência ativa seja excluída,
desativada ou rebaixada por engano.

O e-mail dos membros é visível para pessoas autenticadas (a lista de membros é
usada para login e gestão). Não há dados de estudantes além do que a comissão
cadastrar; notas e pareceres ficam restritos à banca.

## 6. Verificação rápida

```sql
-- Quantos trabalhos existem na base? (20 no seed de demo; 102 após a carga oficial)
select count(*) as trabalhos from public.trabalhos;

-- A presidência e o vínculo com auth.users.
select nome, email, papel, user_id is not null as vinculado
from public.avaliadores
order by ordem;

-- Cobertura: o ideal é 0 trabalhos com 0 ou 1 avaliador.
select
  count(*) filter (where total = 0) as sem_avaliador,
  count(*) filter (where total = 1) as com_um,
  count(*) filter (where total >= 2) as com_dois_ou_mais
from (
  select t.id, count(a.avaliador_id) as total
  from public.trabalhos t
  left join public.atribuicoes a on a.trabalho_id = t.id
  group by t.id
) x;
```

O relatório final do `seed_avaliadores.sql` também mostra os códigos e e-mails
que não encontraram correspondência. Rode o seed de novo depois de corrigir a
base; ele não duplica atribuições.

## 7. Problemas comuns

| Mensagem | Causa | Solução |
|---|---|---|
| `PGRST205 Could not find the table ...` | migração não executada | rode `0001_init.sql` no SQL Editor |
| `Secret API key required` em teste REST | você usou uma chave publishable em endpoint de admin | use o app/SDK com a publishable key; não chame endpoints de admin |
| Login autentica e diz “não cadastrado” | e-mail divergente ou membro inexistente | confira `avaliadores.email` e crie o usuário do Auth |
| `new row violates row-level security policy` | ação sem papel de presidência | entre com uma conta `papel = 'presidente'` e `ativo = true` |
| `A comissão precisa de ao menos uma presidência ativa` | tentativa de remover a última presidência | cadastre outra presidência antes |
| `relation "public.avaliadores" does not exist` | migração não rodou neste projeto/banco | confira a URL do projeto e rode `0001_init.sql` antes do seed |
| Seed diz “95 atribuições” mas o app mostra menos | faltam trabalhos com aqueles códigos | rode `npm run dados:importar -- --aplicar`; veja os códigos ausentes no relatório |

## 8. Deploy

No Vercel, importe o repositório, mantenha o preset **Vite**, build
`npm run build` e output `dist`. Configure em **Settings > Environment
Variables** uma das duplas aceitas:

- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (padrão); ou
- `SUPABASE_URL` + `SUPABASE_ANON_KEY` (nomes da integração Supabase da Vercel).

As variáveis são embutidas no bundle em tempo de build; alterá-las exige um novo
deploy. Use apenas a chave anon/publishable; o build bloqueia `sb_secret_` e
`service_role`.
