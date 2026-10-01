import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isValid } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(
  date: string | Date | null | undefined,
  pattern: string = 'dd MMM yyyy'
): string {
  if (!date) return '—';
  try {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsed)) return '—';
    return format(parsed, pattern);
  } catch {
    return '—';
  }
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

export function getStatusVariant(status: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status.toLowerCase()) {
    case 'paid':
    case 'active':
    case 'occupied':
    case 'approved':
      return {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
      };
    case 'pending':
    case 'notice':
    case 'partial':
    case 'reserved':
      return {
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
      };
    case 'overdue':
    case 'rejected':
    case 'terminated':
    case 'suspended':
      return {
        bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        text: 'text-rose-400',
        border: 'border-rose-500/20',
      };
    case 'vacant':
    case 'vacated':
    case 'draft':
    case 'inactive':
    default:
      return {
        bg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
        text: 'text-zinc-400',
        border: 'border-zinc-500/20',
      };
  }
}
