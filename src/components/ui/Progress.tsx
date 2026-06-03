import { clsx } from 'clsx';

interface Props {
  value: number; // 0-100
  className?: string;
}

export function Progress({ value, className }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={clsx(
        'h-2 w-full rounded-full bg-slate-100 overflow-hidden',
        className
      )}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-brand-500 transition-[width] duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
