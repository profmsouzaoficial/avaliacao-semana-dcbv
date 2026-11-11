import { classNames } from '../lib/format';

interface ProgressRingProps {
  valor: number;
  tamanho?: number;
  espessura?: number;
  cor?: string;
  trilha?: string;
  rotulo?: string;
  className?: string;
}

export function ProgressRing({
  valor,
  tamanho = 64,
  espessura = 6,
  cor = 'var(--color-brand-500)',
  trilha = 'var(--color-line-soft)',
  rotulo,
  className,
}: ProgressRingProps) {
  const seguro = Math.max(0, Math.min(100, valor));
  const raio = (tamanho - espessura) / 2;
  const circunferencia = 2 * Math.PI * raio;
  const deslocamento = circunferencia * (1 - seguro / 100);

  return (
    <div
      className={classNames('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: tamanho, height: tamanho }}
      role="img"
      aria-label={rotulo ?? `${Math.round(seguro)}% concluído`}
    >
      <svg width={tamanho} height={tamanho} className="-rotate-90">
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          fill="none"
          stroke={trilha}
          strokeWidth={espessura}
        />
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          fill="none"
          stroke={cor}
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={deslocamento}
          style={{ transition: 'stroke-dashoffset 500ms cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <span className="absolute text-[11px] font-bold text-ink">
        {Math.round(seguro)}%
      </span>
    </div>
  );
}
