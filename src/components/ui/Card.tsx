import { clsx } from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={clsx(
        'rounded-2xl border border-slate-200 bg-white shadow-soft',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={clsx(
        'flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...rest }: CardProps) {
  return (
    <div {...rest} className={clsx('px-6 py-5', className)}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={clsx(
        'flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-3 rounded-b-2xl',
        className
      )}
    >
      {children}
    </div>
  );
}
