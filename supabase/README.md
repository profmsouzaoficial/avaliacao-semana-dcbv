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

## 4. Cadastrar os demais membros

Há dois caminhos:

- **Pelo app:** entre como presidência > **Curadoria > Membros > Novo membro**.
  Depois crie o usuário correspondente em **Authentication > Users**. No
  primeiro login, o vínculo será feito pelo e-mail.
- **Pelo SQL:** insira os registros em `avaliadores` e crie os usuários do Auth.

Um membro inativo mantém o histórico, mas não recebe novas atribuições e não
consegue entrar (o app encerra a sessão com mensagem explicativa).

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
-- Deve retornar 20 linhas.
select count(*) from public.trabalhos;

-- Deve retornar a presidência e o vínculo com auth.users.
select nome, email, papel, user_id is not null as vinculado
from public.avaliadores
order by ordem;
```

## 7. Problemas comuns

| Mensagem | Causa | Solução |
|---|---|---|
| `PGRST205 Could not find the table ...` | migração não executada | rode `0001_init.sql` no SQL Editor |
| `Secret API key required` em teste REST | você usou uma chave publishable em endpoint de admin | use o app/SDK com a publishable key; não chame endpoints de admin |
| Login autentica e diz “não cadastrado” | e-mail divergente ou membro inexistente | confira `avaliadores.email` e crie o usuário do Auth |
| `new row violates row-level security policy` | ação sem papel de presidência | entre com uma conta `papel = 'presidente'` e `ativo = true` |
| `A comissão precisa de ao menos uma presidência ativa` | tentativa de remover a última presidência | cadastre outra presidência antes |

## 8. Deploy

No Vercel, importe o repositório, mantenha o preset **Vite**, build
`npm run build` e output `dist`. Configure em **Settings > Environment
Variables** uma das duplas aceitas:

- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (padrão); ou
- `SUPABASE_URL` + `SUPABASE_ANON_KEY` (nomes da integração Supabase da Vercel).

As variáveis são embutidas no bundle em tempo de build; alterá-las exige um novo
deploy. Use apenas a chave anon/publishable; o build bloqueia `sb_secret_` e
`service_role`.
