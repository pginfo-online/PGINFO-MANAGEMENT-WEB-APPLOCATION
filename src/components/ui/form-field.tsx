'use client';

import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function FormField({
  label,
  required = false,
  error,
  hint,
  children,
  className = '',
  id,
}: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-wider text-slate-400 block"
        >
          {label} {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
        {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
      </div>

      {children}

      {error && <p className="text-[11px] font-medium text-rose-400 mt-1">{error}</p>}
    </div>
  );
}
