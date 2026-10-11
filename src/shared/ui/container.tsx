import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

type ContainerProps = {
  children: ReactNode;
  className?: string;
};

export function Container({ children, className }: ContainerProps) {
  return <div className={cn('mx-auto w-full max-w-7xl px-6 md:px-10', className)}>{children}</div>;
}
