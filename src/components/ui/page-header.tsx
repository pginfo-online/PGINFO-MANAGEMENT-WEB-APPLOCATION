import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 border-b border-slate-800/80 pb-6 md:flex-row md:items-center md:justify-between',
        className
      )}
    >
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-2 flex items-center space-x-1.5 text-xs text-slate-400">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <div key={idx} className="flex items-center space-x-1.5">
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-emerald-400 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={cn(isLast && 'text-slate-200 font-medium')}>
                      {crumb.label}
                    </span>
                  )}
                  {!isLast && <ChevronRight className="h-3 w-3 text-slate-600" />}
                </div>
              );
            })}
          </nav>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        )}
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-3">{children}</div>
      )}
    </div>
  );
}
