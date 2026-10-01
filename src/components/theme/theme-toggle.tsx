'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './theme-provider';
import { Button } from '@/components/ui/button';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={`relative h-9 w-9 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 transition-all hover:bg-slate-800 hover:text-white ${className}`}
      title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      aria-label="Toggle Theme"
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4 text-[#9a6f2c] transition-transform duration-200 rotate-0" />
      ) : (
        <Sun className="h-4 w-4 text-amber-400 transition-transform duration-200 rotate-0" />
      )}
    </Button>
  );
}
