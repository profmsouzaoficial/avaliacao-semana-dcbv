import type { Trabalho } from '../types';

/** Normaliza título e apresentador para comparar duplicatas da planilha oficial. */
function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Agrupa trabalhos com o mesmo título e o mesmo apresentador.
 *
 * A planilha oficial do parecer repete alguns trabalhos em dois códigos, com
 * diferenças de caixa, pontuação ou ordem de autoria. Não fundimos os registros:
 * a comissão precisa decidir qual código é o oficial. Esta função só os expõe.
 */
export function agruparDuplicatas(trabalhos: Trabalho[]): Trabalho[][] {
  const grupos = new Map<string, Trabalho[]>();
  for (const trabalho of trabalhos) {
    const chave = `${normalizar(trabalho.titulo)}|${normalizar(trabalho.apresentador)}`;
    const lista = grupos.get(chave) ?? [];
    lista.push(trabalho);
    grupos.set(chave, lista);
  }
  return [...grupos.values()]
    .filter((lista) => lista.length > 1)
    .sort((a, b) => a[0].codigo.localeCompare(b[0].codigo));
}
