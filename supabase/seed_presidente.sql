-- ============================================================================
-- Bootstrap da presidência — rode UMA VEZ, depois da migração 0001_init.sql.
--
-- 1. Crie o usuário em Authentication > Users (e-mail + senha, e-mail
--    confirmado).
-- 2. Confira nome, e-mail, titulação e instituição abaixo (já preenchidos para o Dr. Marcio).
-- 3. Rode este arquivo no SQL Editor.
-- 4. Entre no app com esse e-mail e senha: o vínculo é feito no primeiro login.
-- ============================================================================

insert into public.avaliadores (nome, email, titulacao, instituicao, papel, ativo, ordem)
values (
  'Márcio Luís Moreira de Souza',
  'marcio.souza@ufjf.br',
  'Prof. Dr.',
  'UFJF — Campus Governador Valadares',
  'presidente',
  true,
  1
)
on conflict do nothing;
