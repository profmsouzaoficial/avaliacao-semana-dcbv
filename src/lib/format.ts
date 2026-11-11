export function formatarNota(valor: number | null | undefined, casas = 1): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '—';
  return valor.toFixed(casas).replace('.', ',');
}

export function formatarPercentual(valor: number): string {
  return `${Math.round(valor)}%`;
}

export function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) return '—';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '—';
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatarData(iso: string | null | undefined): string {
  if (!iso) return '—';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '—';
  return data.toLocaleDateString('pt-BR');
}

export function formatarDataLonga(iso: string | null | undefined): string {
  if (!iso) return '—';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '—';
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function iniciais(nome: string): string {
  const partes = nome
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

export function primeiroNome(nome: string): string {
  return nome.replace(/\(.*?\)/g, '').trim().split(/\s+/)[0] || nome;
}

export function truncar(texto: string, limite: number): string {
  if (texto.length <= limite) return texto;
  return `${texto.slice(0, limite - 1).trimEnd()}…`;
}

export function periodoInicial(periodo: string): boolean {
  const match = periodo.match(/\d+/);
  if (!match) return false;
  const numero = Number(match[0]);
  return Number.isFinite(numero) && numero >= 1 && numero <= 4;
}

export function classNames(...valores: Array<string | false | null | undefined>): string {
  return valores.filter(Boolean).join(' ');
}

export function uid(prefixo = 'id'): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefixo}-${crypto.randomUUID()}`;
  }
  return `${prefixo}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Concordância simples para rótulos de contagem: `contar(1, 'trabalho', 'trabalhos')`
 * devolve "1 trabalho"; `contar(2, ...)` devolve "2 trabalhos".
 */
export function contar(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}
