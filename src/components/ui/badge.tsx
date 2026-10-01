import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider transition-colors border select-none',
  {
    variants: {
      variant: {
        default:
          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        secondary:
          'bg-slate-800 text-slate-300 border-slate-700/60',
        warning:
          'bg-amber-500/10 text-amber-400 border-amber-500/20',
        destructive:
          'bg-rose-500/10 text-rose-400 border-rose-500/20',
        outline:
          'text-slate-300 border-slate-700 bg-transparent',
        info:
          'bg-sky-500/10 text-sky-400 border-sky-500/20',
        purple:
          'bg-purple-500/10 text-purple-400 border-purple-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'default' && 'bg-emerald-400',
            variant === 'warning' && 'bg-amber-400',
            variant === 'destructive' && 'bg-rose-400',
            variant === 'info' && 'bg-sky-400',
            variant === 'purple' && 'bg-purple-400',
            (!variant || variant === 'secondary' || variant === 'outline') && 'bg-slate-400'
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
